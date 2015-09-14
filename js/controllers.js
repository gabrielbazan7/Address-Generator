var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services","ngLodash"]);
app.controller("addressGeneratorController",function($scope, generatorServices, transactionServices, lodash){
	var mainArray;
	var network;
	var changeArray;
	var transactionArray = [];
	var totalBalance = 0;
	var m = $('#selectM').find('option:selected').attr('id');
	var n = $('#selectN').find('option:selected').attr('id');
	$('#selectN').change(function(){
		$("#button2").hide();
		n = $(this).find('option:selected').attr('id');
	});
	$scope.textArea = "";
	$scope.addr = "";
	$('#form2, #form3, #form4, #form5, #form6').hide();
	$('#selectM').change(function() {
		m = $(this).find('option:selected').attr('id');
		$('#form1, #form2, #form3, #form4, #form5, #form6').hide();
		for (var i = 1; i <= $(this).find('option:selected').attr('id'); i++) {
			$('#form' + i).show();
		}
	})

	$scope.generate = function(){
		$("#messageError2").hide();
		$("#messageSuccess2").hide();
		$scope.messageError2 = "";
		$scope.messageSuccess2 = "";
		var backUps = [];
		var passwords = [];
		backUps.push($scope.backUp1,$scope.backUp2,$scope.backUp3,$scope.backUp4,$scope.backUp5,$scope.backUp6);
		passwords.push($scope.password1,$scope.password2,$scope.password3,$scope.password4,$scope.password5,$scope.password6);
		var copayersData = generatorServices.getCopayersData(backUps,passwords);
		var validation = generatorServices.validation(copayersData, m, n);
		if(validation == true){
		// getting main addresses
			var cont = 0;
			var xPrivKeys = generatorServices.getXPrivKeys(copayersData);
			network = generatorServices.getNetwork(copayersData);
			var mainPath = "m/45'/2147483647/0/";
			var changePath = "m/45'/2147483647/1/";
			$scope.textArea = 'Searching main addresses...\n\n';
			generatorServices.getActiveAddresses(xPrivKeys, mainPath, n, network, function(mainAddressesObject) {
				if(mainAddressesObject.length > 0){
					mainArray = lodash.map(mainAddressesObject ,function(main){
					if(main.utxo.length>0){
						cont++;
						$scope.textArea += 'Address: ' + main.address + '\n';
						$scope.textArea += 'Balance: ' + main.balance + '\n';
						$scope.textArea += 'Unconfirmed balance: ' + main.unconfirmedBalance + '\n';
						$scope.textArea += 'Path: ' + main.path + '\n\n';
					}
					var utxos = [];
					var keys = [];
					for(var j=0; j<main.utxo.length ;j++){
						console.log(main.utxo[j]);
						utxos.push(main.utxo[j]);
						totalBalance += main.utxo[j].amount;
						keys.push(main.keys);
					}	
					if(utxos.length>0){
						return {utxos: utxos,
							keys: keys}
					}
					else
						return;
					})
					mainArray = lodash.remove(mainArray,function (n){
						return !lodash.isUndefined(n);
					});
				$scope.textArea += 'Total main addresses with founds: ' + cont + '\n\n' +'*************************' + '\n';
				}
				else
					$scope.textArea += 'No Main addresses with BTC available.\n';
				$scope.textArea += '\nSearching change addresses...\n\n';
			// getting change addresses
			generatorServices.getActiveAddresses(xPrivKeys, changePath, n, network, function(changeAddressesObject) {
			cont = 0;
			if(changeAddressesObject.length > 0){
				changeArray = lodash.map(changeAddressesObject ,function(change){
				if(change.utxo.length>0){
					cont ++;
					$scope.textArea += 'Address: ' + change.address + '\n';
					$scope.textArea += 'Balance: ' + change.balance + '\n';
					$scope.textArea += 'Unconfirmed balance: ' + change.unconfirmedBalance + '\n';
					$scope.textArea += 'Path: ' + change.path + '\n\n';
				}
				var utxos = [];
				var keys = [];
				for(var j=0; j<change.utxo.length ;j++){
						utxos.push(change.utxo[j]);
						keys.push(change.keys[j]);
						totalBalance += change.utxo[j].amount;
				}	
				if(utxos.length>0){
					return {utxos: utxos,
						keys: keys}
					}
				else
					return;
				})
			changeArray = lodash.remove(changeArray,function (n){
				return !lodash.isUndefined(n);
			});
			$scope.textArea += 'Total change addresses with founds: ' + cont + '\n' +'*************************' + '\n';
			}
		else
			$scope.textArea += 'No Change addresses with founds available.\n\n';
		$("#button2").show();
		$("#messageSuccess2").show();
		$scope.messageSuccess2 = "Search completed";
		console.log(parseInt((totalBalance * 100000000 - 10000).toFixed(0)));
		$scope.totalBalance = "Total amount available to send is: " + parseInt((totalBalance * 100000000).toFixed(0)) + " Satoshis";
		});
		});
	}
	else{
		$("#button2").hide();
		$("#messageError2").show();
		$scope.messageError2 = validation;
	}
}

$scope.send = function(){
	var validation1;
	var validation2;
	$scope.messageSuccess="";
	$scope.messageError = "";
	$("#messageError").hide();
	$("#messageSuccess").hide();
	if(typeof(changeArray)!="undefined"){
		transactionArray = transactionArray.concat(changeArray);}
	if(typeof(mainArray)!="undefined"){
		transactionArray = transactionArray.concat(mainArray);}
	var addr = $scope.addr;
	validation1 = transactionServices.valBalance(totalBalance);
	if(validation1==true){
	validation2 = transactionServices.valAddr(addr,network);
	if(validation2 == true){
		$scope.textArea += 'Creating transaction to retrieve total amount...\n\n';
		var rawTx = transactionServices.createRawTx(addr, transactionArray, totalBalance, n);
		console.log(rawTx);
		console.log(network);
		transactionServices.txBroadcast(rawTx,network).then(function(response,err){
			console.log(err);
			console.log(response);
			$scope.messageSuccess = "Transaction completed";
			$("#messageSuccess").show();
		});
	}else{
		$("#messageError").show();
		$scope.messageError = validation2 + '\n';}	
	}	
	else{
		$("#messageError").show();
		$scope.messageError = validation1 + '\n';}
	}
});


