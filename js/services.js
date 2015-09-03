var app = angular.module("addressGeneratorApp.services",[]);
app.service('generatorServices',['$http',function($http){
	var bitcore = require('bitcore');
	var GAP = 20;
	var root = {};

	root.validate = function(backUp, password){
		if (backUp == "" || password == "")
			return "Please Enter values for all entry boxes.";

		try {
			jQuery.parseJSON(backUp);
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
	}

	root.getXPrivKey = function(password, backUp){
		return JSON.parse(sjcl.decrypt(password, backUp).toString()).xPrivKey;
	}

	root.getAddress = function(xPrivKey, index, path, callback){
		var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);

		// private key derivation
		var derivedHdPrivateKey = hdPrivateKey.derive(path + index);
		var derivedPrivateKey = derivedHdPrivateKey.privateKey;

		// public key derivation
		var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
		var derivedPublicKey = derivedHdPublicKey.publicKey;

		// p2sh 1-1
		var address = new bitcore.Address([derivedPublicKey],1);

		// call insight API for get address information
		root.isAddr(address.toString())
		.then(function(responseAddress){

			// call insight API for get utxo information
			root.isUtxo(address.toString())
			.then(function(responseUtxo){

				var retObject = {};
				var totalAmount = 0;

				for (var i=0; i<responseUtxo.data.length ; i++)
                    totalAmount += responseUtxo.data[i].amount;

				if(responseAddress.data.unconfirmedTxApperances + responseAddress.data.txApperances > 0)
					retObject = {address: responseAddress.data.addrStr, 
								balance: responseAddress.data.balance,
								path: path,
								utxo: totalAmount};

				return callback(retObject);
			});
		});
	}
	
	root.isAddr = function (address){
		return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '?noTxList=1');
	}

	root.isUtxo = function (address){
	    return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '/utxo?noCache=1');
    }

	root.getActiveAddresses = function (password, backUp, path, callback){
		var xPrivKey = root.getXPrivKey(password, backUp);
		var inactiveCount = 0;
		var count = 0;
		var retObject_ = [];

		function derive (index) {
			root.getAddress(xPrivKey, index, path, function(retObject) {		
				if (!jQuery.isEmptyObject(retObject)) {
					retObject_.push(retObject);
					inactiveCount = 0;
				}
				else 
					inactiveCount++;

				if (inactiveCount > GAP)
					return callback(retObject_);
				else 
					derive(index +1);
			});
	    };
		derive(0);
	}

	root.createTx = function (txData){
		var Transaction = bitcore.Transaction;

	//  .from(utxos)          	Feed information about what unspent outputs one can use
	// 	.to(address, amount) 	Add an output with the given amount of satoshis
	// 	.change(address)      	Sets up a change address where the rest of the funds will go
	// 	.sign(privkeySet)     	Signs all the inputs it can

		var tx = new Transaction();
		tx.from();
		tx.to();
		tx.change();
		tx.sign();

		var serialized = tx.toObject();
	}

	return root;
}]);
