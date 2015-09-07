var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services"]);
app.controller("addressGeneratorController",function($scope, generatorServices){
	var addresses = [];
	var utxos = [];
	var privateKeys = [];
	var totalBalance = 0;
	$scope.textArea = "";
	$scope.backUp = "";
	$scope.password = "";
	$scope.addr = "";

	$scope.generate = function(){
		var backUp = $scope.backUp;
		var password = $scope.password;
		var validation = generatorServices.valGenerate(backUp, password);
		var mainPath = "m/45'/2147483647/0/";
		var changePath = "m/45'/2147483647/1/";
		$scope.textArea = 'Searching main addresses...\n\n';

		if(validation == true){
			// getting main addresses
			generatorServices.getActiveAddresses(password, backUp, mainPath, function(mainAddressesObject) {
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
			$scope.textArea = validation;
		}
	}

	$scope.send = function(){
		var addr = $scope.addr;
		var validation = generatorServices.valCreateRawTx(addr);

		if(validation == true){
			$scope.textArea += 'Creating transaction to retrieve total amount...\n\n';

			var rawTx = generatorServices.createRawTx(addr, utxos, totalBalance, privateKeys);
			generatorServices.txBroadcast(rawTx, function(response){
				console.log(response);
			});
		}else
			$scope.textArea += validation + '\n\n';		
	}
});


