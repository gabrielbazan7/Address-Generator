var app = angular.module("addressGeneratorApp.services",[]);
app.service('generatorServices',['$http',function($http){

	var validate = function(bck,pwd){
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

	var getXPrivKey = function(pwd,bck){
		return JSON.parse(sjcl.decrypt(pwd,bck).toString()).xPrivKey;
	};

	var getAddress = function(xPrivKey){
		var i = 0;
		var bitcore = require('bitcore');
		var addr = [];
		var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);

		for (var count = 0 ; count < 5000; count++) {
			// private key derivation
			var derivedHdPrivateKey = hdPrivateKey.derive("m/45'/0/"+i);
			var derivedPrivateKey = derivedHdPrivateKey.privateKey;
		
			// public key derivation
			var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
			var derivedPublicKey = derivedHdPublicKey.publicKey;
			var address = derivedPublicKey.toAddress();

			isAddr(address.toString()).then(function(response){
				console.log('unconfirmedTxApperances: ' + response.data.unconfirmedTxApperances + ' -'+' txApperances: '+response.data.txApperances);
			
				if(response.data.unconfirmedTxApperances + response.data.txApperances > 0){
					addr += address.toString()+'\n';
					count == 0;	
				}
			});
			i = i + 1;
		}

		return addr;
	};

	var isAddr = function (address){
		return $http.get('https://test-insight.bitpay.com/api/addr/'+address+'?noTxList=1');
	};

	return {
        getXPrivKey : getXPrivKey,
        getAddress: getAddress,
        validate : validate
    }
}]);
