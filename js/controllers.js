var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services"]);
app.controller("addressGeneratorController",function($scope, generatorServices){
	$scope.generate = function(){
		var backUp = $scope.backUp;
		var password = $scope.password;
		var validation = generatorServices.validate(backUp, password);
		var mainPath = "m/45'/2147483647/0/";
		var changePath = "m/45'/2147483647/1/";
		$scope.textArea = "";
		
		$scope.textArea = 'Searching main addresses...' + '\n\n';

		if(validation == true){
			// getting main addresses
			generatorServices.getActiveAddresses(password, backUp, mainPath, function(mainAddressesObject) {
				if(mainAddressesObject.length > 0){
					$scope.textArea += 'Addresses found: ' + mainAddressesObject.length + '\n' +
										'*************************' + '\n';
					
					for(var i=0; i<mainAddressesObject.length ;i++){
						$scope.textArea += 'Address: ' + mainAddressesObject[i].address + '\n';
						$scope.textArea += 'Balance: ' + mainAddressesObject[i].balance + '\n';
						$scope.textArea += 'Path: ' + mainAddressesObject[i].path + '\n';
						$scope.textArea += 'Utxos: ' + mainAddressesObject[i].utxo + '\n\n';
						console.log(mainAddressesObject);
					}
				}
				else
					$scope.textArea += 'No Main addresses available.' + '\n\n';

				$scope.textArea += '------------------------------------------------------------------------------------------------------' + 
									'-----------------------------------------------------------------------------------------------------' + 
									'\nSearching change addresses...' + '\n\n';
				
				// gettin change addresses
				generatorServices.getActiveAddresses(password, backUp, changePath, function(changeAddressesObject) {

					if(changeAddressesObject.length > 0){
						$scope.textArea += 'Addresses found: ' + changeAddressesObject.length + '\n' +
											'*************************' + '\n';

						for(var n=0; n<changeAddressesObject.length ;n++){
							$scope.textArea += 'Address: ' + changeAddressesObject[n].address + '\n';
							$scope.textArea += 'Balance: ' + changeAddressesObject[n].balance + '\n';
							$scope.textArea += 'Path: ' + changeAddressesObject[n].path + '\n';
							$scope.textArea += 'Utxos: ' + changeAddressesObject[n].utxo + '\n\n';
							console.log(changeAddressesObject);
						}
					}
					else
						$scope.textArea += 'No Change addresses available.' + '\n\n';
				});
			});
		}
		else{
			$scope.textArea = validation;
		}
	}
});


