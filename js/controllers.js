var app = angular.module("addressApp",[]);
app.controller("addressController",function($scope){
	$scope.generate = function(){
		var bck = $scope.bck;
		var pwd = $scope.pwd;
		var num = $scope.num;
		var validation = validate(bck,pwd,num);
		
		if(validation == true){
			var xPrivKey = getXPrivKey(pwd,bck);
			var addr = getAddress(xPrivKey,num);
			$scope.textbox = addr;
		}
		else{
			$scope.textbox= validation;
		}
	}

	var validate = function(bck, pwd, num){
		if (bck == "" || pwd == "" || num == "") {
			return "Please Enter values for all entry boxes.";
		};
		if (num < 0) {
	       return "Please Enter a positive integer value for the number of addresses.";
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
	}

	var getXPrivKey = function(pwd, bck){
		return JSON.parse(sjcl.decrypt(pwd,bck).toString()).xPrivKey;
	}

	var getAddress = function(xPrivKey, num){
		var bitcore = require('bitcore');
		var addr = [];
		var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);

		for (var i = 0; i < num; i++) {
			// private key derivation
			var derivedHdPrivateKey = hdPrivateKey.derive("m/45'/0/"+i);
			var derivedPrivateKey = derivedHdPrivateKey.privateKey;

			// public key derivation
			var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
			var derivedPublicKey = derivedHdPublicKey.publicKey;
			var address = derivedPublicKey.toAddress();
			
			addr += address.toString()+'\n';
		}

		return addr;
	}
});


