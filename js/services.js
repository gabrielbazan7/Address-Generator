var app = angular.module("addressGeneratorApp.services",[]);
app.service('generatorServices',['$http',function($http){
var i = 0;
var GAP = 20;
var root = {};

	root.validate = function(backUp, password){
		if (backUp == "" || password == "") {
			return "Please Enter values for all entry boxes.";
		};
		try {
			jQuery.parseJSON( backUp );
		} catch(e) {
			return "Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.";
		};
		var plain;
		try {
			plain = sjcl.decrypt(password, backUp);
		} catch(e) {
			return "Seems like your password is incorrect. Try again.";
		};
		return true;
	};

	root.getXPrivKey = function(password, backUp){
		return JSON.parse(sjcl.decrypt(password, backUp).toString()).xPrivKey;
	};

	root.getAddress = function(xPrivKey, index, path, callback){
		var bitcore = require('bitcore');
		var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);

		// private key derivation
		var derivedHdPrivateKey = hdPrivateKey.derive(path + index);
		var derivedPrivateKey = derivedHdPrivateKey.privateKey;

		// public key derivation
		var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
		var derivedPublicKey = derivedHdPublicKey.publicKey;

		// p2sh 1-1
		var address = new bitcore.Address([derivedPublicKey],1);

		root.isAddr(address.toString())
		.then(function(response){
			var ret;

			if(response.data.unconfirmedTxApperances + response.data.txApperances > 0)
				ret = address.toString();
			
			return callback(ret);
		});
	}
	
	root.isAddr = function (address){
			return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '?noTxList=1');
	};

	root.getActiveAddresses = function(password, backUp, path, callback){
		var xPrivKey = root.getXPrivKey(password, backUp);
		var inactiveCount = 0;
		var count = 0;
		var ret = [];

		function derive(index) {
			root.getAddress(xPrivKey, index, path, function(addr) {		
				if (addr) {
					ret.push(addr);
					inactiveCount = 0;
				}
				else 
					inactiveCount++;

				if (inactiveCount > GAP)
					return callback(ret);
				else 
					derive(index +1);
			});
	    };
		derive(0);
	}

	return root;
}]);
