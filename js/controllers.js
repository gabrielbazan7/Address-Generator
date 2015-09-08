var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services","ngLodash"]);
app.controller("addressGeneratorController",function($scope, generatorServices,lodash){
	var addresses = [];
	var backUps = [];
	var passwords = [];
	var utxos = [];
	var privateKeys = [];
	var totalBalance = 0;
	$scope.textArea = "";
	$scope.addr = "";
	$('#form2, #form3, #form4, #form5, #form6').hide();
	$('#select').change(function() {
   	$('#form1, #form2, #form3, #form4, #form5, #form6').hide();
   	for (var i = 1; i <= $(this).find('option:selected').attr('id'); i++) {
   		 $('#form' + i).show();
   	}
	})

	$scope.generate = function(){
		backUps.push($scope.backUp1,$scope.backUp2,$scope.backUp3,$scope.backUp4,$scope.backUp5,$scope.backUp6);
		passwords.push($scope.password1,$scope.password2,$scope.password3,$scope.password4,$scope.password5,$scope.password6);
		backUps = lodash.remove(backUps,function (n){
			return !lodash.isUndefined(n);
		});
		passwords = lodash.remove(passwords,function (n){
			return !lodash.isUndefined(n);
		});
		var validation = generatorServices.valGenerate(backUps, passwords);
		var mainPath = "m/45'/2147483647/0/";
		var changePath = "m/45'/2147483647/1/";
		$scope.textArea = 'Searching main addresses...\n\n';

		if(true){
			// getting main addresses
			generatorServices.getActiveAddresses(passwords, backUps, mainPath, function(mainAddressesObject) {
				if(mainAddressesObject.length > 0){
					mainAddrObject = mainAddressesObject;
					$scope.textArea += 'Addresses found: ' + mainAddressesObject.length + '\n' +
										'*************************' + '\n';
					
					for(var i=0; i<mainAddressesObject.length ;i++){
						$scope.textArea += 'Address: ' + mainAddressesObject[i].address + '\n';
						$scope.textArea += 'Balance: ' + mainAddressesObject[i].balance + '\n';
						$scope.textArea += 'Path: ' + mainAddressesObject[i].path + '\n\n';

						for(var j=0; j<mainAddressesObject[i].utxo.length ;j++){
							utxos.push(mainAddressesObject[i].utxo[j]);
							privateKeys.push(mainAddressesObject[i].privKey[j]);
						}	
						
						totalBalance += mainAddressesObject[i].balance;
					}
				}
				else
					$scope.textArea += 'No Main addresses available.\n\n';

				$scope.textArea += '------------------------------------------------------------------------------------------------------' + 
									'-----------------------------------------------------------------------------------------------------' + 
									'\nSearching change addresses...\n\n';
				
				// getting change addresses
				generatorServices.getActiveAddresses(password, backUp, changePath, function(changeAddressesObject) {

					if(changeAddressesObject.length > 0){
						changeAddrObject = changeAddressesObject;
						$scope.textArea += 'Addresses found: ' + changeAddressesObject.length + '\n' +
											'*************************' + '\n';

						for(var n=0; n<changeAddressesObject.length ;n++){
							$scope.textArea += 'Address: ' + changeAddressesObject[n].address + '\n';
							$scope.textArea += 'Balance: ' + changeAddressesObject[n].balance + '\n';
							$scope.textArea += 'Path: ' + changeAddressesObject[n].path + '\n\n';

							for(var k=0; k<changeAddressesObject[n].utxo.length ;k++){
								utxos.push(changeAddressesObject[n].utxo[k]);
								privateKeys.push(changeAddressesObject[n].privKey[k]);
							}

							totalBalance += changeAddressesObject[n].balance;
						}
					}
					else
						$scope.textArea += 'No Change addresses available.\n\n';
						$("#button2").show();
				});
			});
		}
		else{
			$("#button2").hide();
			$scope.textArea = validation;
		}
	}

	$scope.send = function(){
		var addr = $scope.addr;
		var validation = generatorServices.valCreateRawTx(addr,totalBalance);

		if(validation == true){
			$scope.textArea += 'Creating transaction to retrieve total amount...\n\n';

			var rawTx = generatorServices.createRawTx(addr, utxos, totalBalance, privateKeys);
			generatorServices.txBroadcast(rawTx).then(function(response ){
				$scope.message = "Transaction completed";
				console.log(err);
				console.log(response);
			});
		}else
			$scope.textArea += validation + '\n\n';		
	}
});


