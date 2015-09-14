var app = angular.module("addressGeneratorApp.services",['ngLodash']);
app.service('generatorServices',['$http', 'lodash',function($http, lodash){
	var bitcore = require('bitcore');
	var Address = bitcore.Address;
	var root = {};

	 root.validation = function(copayersData, m, n){
	 	var validation = "";

	 	if(copayersData.length>0 && copayersData.length == m){
		 	lodash.each(copayersData, function(cop) {
		 		console.log(cop.backUp);
		 	if (cop.backUp == "" || cop.password == ""){
	            validation = "Please enter values for all entry boxes.";
	            return validation;
	        }
            try {
                JSON.parse(cop.backUp.toString());
	            } catch(e) {
	                validation = "Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.";
	                return validation;
	            };
	            try {
	                sjcl.decrypt(cop.password, cop.backUp);
	            } catch(e) {
	                validation = "Seems like your password is incorrect. Try again.";
	                return validation;
	            };

	            if ((JSON.parse(sjcl.decrypt(cop.password, cop.backUp)).m != m) 
	            	|| (JSON.parse(sjcl.decrypt(cop.password, cop.backUp)).n != n)){
	                validation= "The wallet type (m/n) is not matched with 'm' and 'n' values.";
	                return validation;
	            }
	            if(JSON.parse(sjcl.decrypt(cop.password, cop.backUp).toString()).xPrivKey = ""){
	            	validation= "You are using a backup that cant be use to sign";
	            	return validation;
	            }
		 	});
		}
		else{
			validation ="Please enter values for all entry boxes.";
			return validation;
		}
		if(validation==""){
			if(typeof(copayersData)!="undefined"){
				for (var i = copayersData.length - 1; i >= 0; i--) {
	 				for (var j = copayersData.length - 1; j >= 0; j--) {
	 					if(JSON.parse(sjcl.decrypt(copayersData[i].password, copayersData[i].backUp)).network 
	 					!= JSON.parse(sjcl.decrypt(copayersData[j].password, copayersData[j].backUp)).network){
	 						validation = "Please use only testnets backups or only livenets backups";
	 						return validation;
	 					}
	 				}
	 			}
	 		}
		}
	 	if(validation != ""){
	 	return validation;
	 	}
	 	else{
        return true;
    	}
    }

    root.getCopayersData = function (backUps,passwords){
    	backUps = lodash.remove(backUps,function (n){
			return !lodash.isUndefined(n);
		});
		passwords = lodash.remove(passwords,function (n){
			return !lodash.isUndefined(n);
		});
		var copayersData = [];
		for (var i = 0; i< backUps.length ;i++) {
			copayersData.push({backUp : backUps[i], password: passwords[i]});
		}
		return copayersData;
    }

    root.getXPrivKeys = function(copayersData){
		var xPrivKeys = lodash.map(copayersData, function(cop){
			return JSON.parse(sjcl.decrypt(cop.password, cop.backUp).toString()).xPrivKey;
		});
		return xPrivKeys;
	}

	root.getNetwork = function(copayersData){
		return JSON.parse(sjcl.decrypt(copayersData[0].password, copayersData[0].backUp)).network
	}

	root.getActiveAddresses = function(xPrivKeys, path, n, network, callback){
		var GAP = 20;
		var inactiveCount = 0;
		var retObject_ = [];

		function derive(index){
			root.getAddress(xPrivKeys, index, path, n, network, function(retObject) {
				if (!jQuery.isEmptyObject(retObject)) {
					retObject_.push(retObject);
					inactiveCount = 0;
				}
				else 
					inactiveCount++;

				if (inactiveCount > GAP){
					return callback(retObject_);
				}
				else 
					derive(index +1);
			});
	    };
		derive(0);
	}

	root.getAddress = function(xPrivKeys, index, path, n, network, callback){
		var keys = lodash.map(xPrivKeys, function(xPrivKey){
			var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);
			var derivedHdPrivateKey = hdPrivateKey.derive(path + index);
			var derivedPrivateKey = derivedHdPrivateKey.privateKey;
			var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
			return {dPrivKey: derivedPrivateKey,
					dPubKey: derivedHdPublicKey.publicKey};
		})
		if(network=='testnet')
		var address = new bitcore.Address.createMultisig(lodash.pluck(keys,'dPubKey'),parseInt(n),'testnet');
		if(network=='livenet')
		var address = new bitcore.Address.createMultisig(lodash.pluck(keys,'dPubKey'),parseInt(n),'livenet');
		// call insight API for get address information
		root.searchAddress(address.toString(),network).then(function(responseAddress){
			// call insight API for get utxo information
			root.searchUtxos(address.toString(),network).then(function(responseUtxo){
				var retObject = {};
				if(responseAddress.data.unconfirmedTxApperances + responseAddress.data.txApperances > 0){
					retObject = {address: responseAddress.data.addrStr, 
								balance: responseAddress.data.balance,
								unconfirmedBalance : responseAddress.data.unconfirmedBalance,
								path: path + index,
								utxo: responseUtxo.data,
								keys: keys};
				}
				return callback(retObject);
				});
		});
	}
	
	root.searchAddress = function(address,network){
		if(network=='testnet'){
		return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '?noTxList=1');}
		if(network=='livenet'){
		return $http.get('https://insight.bitpay.com/api/addr/' + address + '?noTxList=1');}	
	}

	root.searchUtxos = function(address,network){
		if(network=='testnet'){
	    return $http.get('https://test-insight.bitpay.com/api/addr/' + address + '/utxo?noCache=1');}
	    if(network=='livenet'){
	    return $http.get('https://insight.bitpay.com/api/addr/' + address + '/utxo?noCache=1');}
    }

    return root;
}]);

app.service('transactionServices',['$http', 'lodash',function($http, lodash){
	var bitcore = require('bitcore');
	var Transaction = bitcore.Transaction;
	var Address = bitcore.Address;
	var root = {};

	root.valBalance = function(totalBalance){
		if(parseInt((totalBalance * 100000000 - 10000).toFixed(0)) <= 0)
			return 'The total amount is not enought to make a transaction';
		return true;
	}
	root.valAddr = function(addr,network){
		var bitcore = require('bitcore');
		var Address = bitcore.Address;
		if(addr == '' || addr.length < 20 || !Address.isValid(addr))
			return 'Please enter a valid address.';
		try {
             var addr = new Address(addr,network);
            } catch(e) {
                return "Please use a "+ network + ' address. Your backup is from a '+network+' address';
            };
		return true;
	}

	root.createRawTx = function(address, transactionArray, totalBalance,n){
		var pub = [];
		var pri = [];
		var priv = [];
		console.log(address);
		console.log(transactionArray);
		console.log(totalBalance);
		console.log(n);
		var amount = parseInt((totalBalance * 100000000 - 10000).toFixed(0));
		var tx = new Transaction();
		lodash.each(transactionArray, function(value){
		lodash.each(value.utxos, function(utxo){
			lodash.each(value.keys,function(key){
					priv = lodash.map(key,function(setOfKeys){
						return setOfKeys.dPrivKey;
					})
					pub = lodash.map(key,function(setOfKeys){
						return setOfKeys.dPubKey;	
					})
				});
			console.log(priv,pub);
			pri = pri.concat(priv);
				tx.from(utxo,pub,parseInt(n));
			});
		});
		tx.to(address, amount);
		console.log(pri);
		tx.sign(lodash.uniq(pri));
		console.log(tx);
		var rawTx = tx.serialize();
		console.log(rawTx);
		return rawTx;
	}

	root.txBroadcast = function(rawTx,network){
		if(network == 'testnet'){
		return $http.post('https://test-insight.bitpay.com/api/tx/send', {rawtx: rawTx});}
		if(network == 'livenet'){
		return $http.post('https://insight.bitpay.com/api/tx/send', {rawtx: rawTx});}
	}

	return root;
}]);







