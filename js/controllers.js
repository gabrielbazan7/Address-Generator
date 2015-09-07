var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services"]);
app.controller("addressGeneratorController",function($scope, generatorServices){
	var addresses = [];
	var utxos = [];
	var privateKeys = [];
	var totalBalance = 0;
	$scope.textArea = "";
	$scope.backUp = '{"iv":"j9aSNDqstgHWAjQ2CIcczQ==","v":1,"iter":10000,"ks":128,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6zuJMaL+VSY=","ct":"YGz3Y3SjizjqIf4O9XxswdzPV4bmTYEu5KWfzydXPUMzq/grF5PFuI4U4vKHZ6CMvtYMDcCOU6zU6ReftczNy+BJqcM93sKOLUfEbYjSnY13w/+mzzv+7MHkwqmgQW1ezkowNS2W5gGMXdfPTKTSaXaZ28g2x8HPkxYwaedO1HCRGmK+cvs6G3/Vd0o138ToR7LwTlSAxOKo9aTC5c7ksgK61IuUcOAZi07hmo9L2QjFm8YWrbTSJpCoQ/pZSOY5JT6noPZiTxYfsNarttOpkR7IkqkpY7+V0UPMZi4zlUTbvHIzzhvP/S7bEKJsywvl6kPpEh80RfnI2EFqML/6hFG6bZ/llKrChOQCGTLBztnbXBAjk0bgiDFiZSLQ1S0qKgWNet0S4huhH5zjeoiWpDPH8w8o59n821VpN5fc/HpG00PToGSSV9UOjDZSWvjVPIVsCUYpYvzGk+0M/3OCYspwRLsSen8XdeoJw40bJxjy0NHE+1bZMSbGyllCmBnzz3WOyOPKJkvYk9LayTR6Hqg7cCfzU8w8i1/+YqOt8NjFlQqJ1RGf2Bf6Eky/O31dxQ4BuA/k/ehzE2HpCv5gAymjXk+9H9ssxq/kuAn4qMfRaV324e76Rd4Vt5Q1Psr6QADyvmHyYuDfnCEmHdf9EVaPonEIi2pjIiXgTO/wArsuHb8IN4YbXqJOboUYyH2ASpILikSlFpZBjf75T8RR+uX3F/lb4STvIdk0sFNpMf1ZlF2BkOs9G/wrS/Wj/Kz+xb4VXAN2X7gBvRXCQwk5v0GxKMiErpVRytbbq26JPXTLjkBBw7cAOHC+HA4x2H4EXVVZb6vb70RK3F+g6ZQ6c3cQ3xslkTcwKjsZC2V61ylc7Xzgniu5HRMEeeI3hD8UibBav34Pxf/szqrJO2l/N7cJVEMVjgoNDCRJv84TD04O8v1r3B8RKcMPz8UdwK1/pTlOspMQ7X6kFnNTK+8hTzP1Lf1EFUKEu3W6ztk/V4MZSF64KX1NKuH7ve63ArrYkczCp62aFNA5wu+mo/FxSIVJe5fBlhWbwIjExd8qNffqayUqSLL8dVtie68UPjh/Wp/TQHXlJJDiRFAuLAFAXgaQVOFxI73AkmhmwceKnXV+mA+w7W4CyUH0FNyFRubGuSASNJgoxQ1fMOpaKaL20YlHO6QQEd009hWzLPpU7hk6tog4AbcLNUvTeWHdyaD3k9mcUEXgTeckQLlyLj/1QQlG9tn7kpcrJDjWnt0F/MC/4is4rSDB4JIc6F9mRplOavvlvSd+UslFL/2zgEfKg4zeRZTr2Vj98hX+myyGGL83d+YgCbnNiBwhkJ+/5HBkpKkpCVcdbNeUpAUkkU1EtsC6VLwFxQ0zOW9ldosP5U/Y6Gg6zkYy8vDeoYij"}';
	$scope.password = '1';
	$scope.addr = '2NDkFgJKSZNHpMN4DBKx9sLPNHfPmEAeqPg';

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
			generatorServices.txBroadcast(rawTx);
		}else
			$scope.textArea += validation + '\n\n';		
	}
});


