var app = angular.module("addressGeneratorApp.services",['ngLodash']);
app.service('generatorServices',['$http', 'lodash',function($http, lodash){
	var bitcore = require('bitcore');
	var Transaction = bitcore.Transaction;
	var Address = bitcore.Address;
	var GAP = 20;
	var root = {};

	 root.valGenerate = function(backUps, passwords, m, n){
        for (var i = backUps.length - 1; i >= 0; i--) {
            if (backUps[i] == "" || passwords[i] == "")
                return "Please enter values for all entry boxes.";

            try {
                jQuery.parseJSON(backUps[i]);
            } catch(e) {
                return "Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.";
            };

            try {
                sjcl.decrypt(passwords[i], backUps[i]);
            } catch(e) {
                return "Seems like your password is incorrect. Try again.";
            };

            if (JSON.parse(sjcl.decrypt(passwords[i], backUps[i])).m != m || JSON.parse(sjcl.decrypt(passwords[i], backUps[i])).n != n)
                return "The wallet (" + i + ") type (m/n) is not matched with 'm' and 'n' values.";
        }
        return true;
    }

	root.getXPrivKey = function(password, backUp){
		return JSON.parse(sjcl.decrypt(password, backUp).toString()).xPrivKey;
	}

	root.getAddress = function(xPrivKeys, index, path, n, callback){
		var derivedPublicKeys = [];
		var derivedPrivateKeys =[];

		for (var i = xPrivKeys.length - 1; i >= 0; i--) {
			var hdPrivateKey = bitcore.HDPrivateKey(xPrivKeys[i]);
			// private key derivation
			var derivedHdPrivateKey = hdPrivateKey.derive(path + index);
			var derivedPrivateKey = derivedHdPrivateKey.privateKey;
			derivedPrivateKeys.push(derivedPrivateKey);
			// public key derivation
			var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
			derivedPublicKeys.push(derivedHdPublicKey.publicKey);
		}
		var address = new bitcore.Address(derivedPublicKeys,n);

		// call insight API for get address information
		root.isAddr(address.toString())
		.then(function(responseAddress){

			// call insight API for get utxo information
			root.isUtxo(address.toString())
			.then(function(responseUtxo){
				var privKeys = [];
				var retObject = {};
				var utxos = {};
				var privKeyArray = [];
				if(responseAddress.data.unconfirmedTxApperances + responseAddress.data.txApperances > 0){
						for (var j = 0; j<derivedPrivateKeys.length; j++) {
						    privKeys.push(derivedPrivateKeys[j]);}
							for(var i=0; i<responseUtxo.data.length ;i++) {
						privKeyArray.push(privKeys);
					}
					 utxos = {utxo: responseUtxo.data,
					 		 privKeys: privKeyArray};
					retObject = {address: responseAddress.data.addrStr, 
								balance: responseAddress.data.balance,
								path: path + index,
								utxoData: utxos};
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

	root.getActiveAddresses = function(passwords, backUps, path, n, callback){
		var xPrivKeys = [];
		for (var i = 0; i < backUps.length ; i++) {
			xPrivKeys.push(root.getXPrivKey(passwords[i], backUps[i]));
		}
		var inactiveCount = 0;
		var count = 0;
		var retObject_ = [];

		function derive(index){
			root.getAddress(xPrivKeys, index, path, n, function(retObject) {		
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

	root.createRawTx = function(address, utxos, totalBalance, privKeys, n){
		var pub = [];
		var pri = [];
		var tx = new Transaction();
		var amount = parseInt((totalBalance * 100000000 - 10000).toFixed(0));
		for(var j=0; j<utxos.length ;j++){
			for (var i = 0; i<privKeys[j].length; i++) {
				var priv = new bitcore.PrivateKey(privKeys[j][i]);
				pri.push(priv);
				pub.push(priv.publicKey);
			}
			tx.from(utxos[j], pub, n);
			pub=[];
		}
		tx.to(address, amount);
		tx.sign(lodash.uniq(pri));

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







