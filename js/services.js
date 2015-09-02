var app = angular.module("addressGeneratorApp.services",[]);
app.service('generatorServices',['$http',function($http){
var i = 0;
var GAP=20;
var root={};

	root.validate = function(bck,pwd){
		if (bck == "" || pwd == "") {
			return "Please Enter values for all entry boxes.";
		};
		try {
			jQuery.parseJSON( bck );
		} catch(e) {
			return "Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.";
		};
		var plain;
		try {
			plain = sjcl.decrypt(pwd, bck);
		} catch(e) {
			return "Seems like your password is incorrect. Try again.";
		};
		return true;
	};

	root.getXPrivKey = function(pwd,bck){
		return JSON.parse(sjcl.decrypt(pwd,bck).toString()).xPrivKey;
	};

	root.getAddress = function(xPrivKey,count,cb){
		var i = 0;
		var y = 0;
		var bitcore = require('bitcore');
		var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);
		// private key derivation
		var derivedHdPrivateKey = hdPrivateKey.derive("m/45'/2147483647/0/"+count);
		var derivedPrivateKey = derivedHdPrivateKey.privateKey;
		// public key derivation
		var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
		var derivedPublicKey = derivedHdPublicKey.publicKey;
		var address = new bitcore.Address([derivedPublicKey],1);
		//console.log(address.toString());
		root.isAddr(address.toString()).then(function(response){
			var ret;		
			if(response.data.unconfirmedTxApperances + response.data.txApperances > 0){
				ret=address.toString();
			}
			//console.log(response);
			     return cb(ret);
			});

		// var derivedHdPrivateKey = hdPrivateKey.derive("m/45'/2147483647/1/"+count);
		// var derivedPrivateKey = derivedHdPrivateKey.privateKey;
		// // public key derivation
		// var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
		// var derivedPublicKey = derivedHdPublicKey.publicKey;
		// var address = new bitcore.Address([derivedPublicKey],1);
		// //console.log(address.toString());
		// isAddr(address.toString()).then(function(response){		
		// 	if(response.data.unconfirmedTxApperances + response.data.txApperances > 0){
		// 		addr.push(' '+address.toString());
		// 	}
		// 	//console.log(response);
		// 	return cb(addr);
		// 	});
	}
	
	root.isAddr = function (address){
			return $http.get('https://test-insight.bitpay.com/api/addr/'+address+'?noTxList=1');
	};

	root.getActiveAddresses = function(pwd,bck,cb){

			var xPrivKey = root.getXPrivKey(pwd,bck);
			var inactiveCount=0;
			var count=0;
			var ret=[];

			function derive(index) {
				root.getAddress(xPrivKey, index, function(addr) {		
					if (addr) {
						ret.push(addr);
						inactiveCount=0;
					}
					else 
						inactiveCount++;

					if (inactiveCount > GAP ){
						return cb(ret);}
					else 
						derive(index +1);
				});
		    };
			derive(0);
	}

	return root;
}]);
