var app = angular.module("addressGeneratorApp.services",['ngLodash']);
app.service('generatorServices',['$http', 'lodash',function($http, lodash){
	var bitcore = require('bitcore');
	var Transaction = bitcore.Transaction;
	var Address = bitcore.Address;
	var GAP = 20;
	var root = {};

	root.valGenerate = function(backUp, password){
		for (var i = backUp.length - 1; i >= 0; i--) {
			if (backUp[i] == "" || password[i] == "")
			return "Please enter values for all entry boxes.";

		try {
			jQuery.parseJSON(JSON.parse(backUp[i]));
		} catch(e) {
			return "Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.";
		};

		var plain;
		try {
			plain = sjcl.decrypt(password[i], JSON.parse(backUp[i]));
		} catch(e) {
			return "Seems like your password is incorrect. Try again.";
		};
		}
		return true;
	}

	root.getXPrivKey = function(password, backUp){
		console.log(JSON.parse(backUp));
		console.log(password);
		console.log(sjcl.decrypt(password, JSON.parse(backUp)));
		console.log("hola2");
		console.log(sjcl.decrypt(password, JSON.parse(backUp)));
		return JSON.parse(sjcl.decrypt(password, JSON.parse(backUp)).toString()).xPrivKey;
	}

	root.getAddress = function(xPrivKeys, index, path, callback){
		var derivedPublicKeys = [];
		for (var i = xPrivKeys.length - 1; i >= 0; i--) {
			var hdPrivateKey = bitcore.HDPrivateKey(xPrivKeys[i]);
			// private key derivation
			var derivedHdPrivateKey = hdPrivateKey.derive(path + index);
			var derivedPrivateKey = derivedHdPrivateKey.privateKey;

			// public key derivation
			var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
			derivedPublicKeys.push(derivedHdPublicKey.publicKey);
		}
		var address = new bitcore.Address(derivedPublicKeys,xPrivKeys.length);
		// call insight API for get address information
		root.isAddr(address.toString())
		.then(function(responseAddress){

			// call insight API for get utxo information
			root.isUtxo(address.toString())
			.then(function(responseUtxo){
				var privKeys = [];
				var retObject = {};

				if(responseAddress.data.unconfirmedTxApperances + responseAddress.data.txApperances > 0){
					// for(var i=0; i<responseUtxo.data.length ;i++)
					lodash.each(responseUtxo.data)
						privKeys.push(derivedPrivateKey);

					retObject = {address: responseAddress.data.addrStr, 
								balance: responseAddress.data.balance,
								path: path + index,
								utxo: responseUtxo.data,
								privKey: privKeys};
				}

				return callback(retObject);
			});
		});
	}
	
	root.isAddr = function(address){
		return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '?noTxList=1');
	}

	root.isUtxo = function(address){
	    return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '/utxo?noCache=1');
    }

	root.getActiveAddresses = function(passwords, backUps, path, callback){
		var xPrivKeys = [];
		for (var i = 0; i < backUps.length ; i++) {
			console.log(JSON.parse(backUps[i]));
			xPrivKeys.push(root.getXPrivKey(passwords[i], JSON.parse(backUps[i])));
		}
		console.log(xPrivKeys);
		var inactiveCount = 0;
		var count = 0;
		var retObject_ = [];

		function derive(index){
			root.getAddress(xPrivKeys, index, path, function(retObject) {		
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

	root.createRawTx = function(address, utxos, totalBalance, privKeys){
		var tx = new Transaction();
		var amount = parseInt((totalBalance * 100000000 - 10000).toFixed(0));

		for(var i=0; i<utxos.length ;i++){
			var priv = new bitcore.PrivateKey(privKeys[i]);
			tx.from(utxos[i], [priv.publicKey], 1);
		}

		tx.to(address, amount);
		tx.sign(lodash.uniq(privKeys));

		var rawTx = tx.serialize();
		return rawTx;
	}

	root.valCreateRawTx = function(addr,totalBalance){
		if(addr == '' || addr.length < 20 || !Address.isValid(addr))
			return 'Please enter a valid address.';
		if(totalBalance <=0)
			return 'The total balance in your address is 0';
		return true;
	}

	root.txBroadcast = function(rawTx){
		return $http.post('https://test-insight.bitpay.com/api/tx/send', {rawtx: rawTx});
	}

	return root;
}]);







