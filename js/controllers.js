var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services"]);
app.controller("addressGeneratorController",function($scope, generatorServices){
	$scope.generate = function(){
		var backUp = $scope.backUp;
		var password = $scope.password;
		var validation = generatorServices.validate(backUp, password);
		var mainPath = "m/45'/2147483647/0/";
		var changePath = "m/45'/2147483647/1/";
		$scope.textArea = "";
		
		$scope.textArea = 'Searching addresses...' + '\n';

		if(validation == true){
			// getting main addresses
			generatorServices.getActiveAddresses(password, backUp, mainPath, function(mainAddresses) {
				if(mainAddresses.length > 0)
					$scope.textArea += 'Main addresses:\n' + mainAddresses.toString().replace(/,/g,'\n') + '\n\n';
				else
					$scope.textArea += 'No Main addresses available.' + '\n';
			});

			// gettin change addresses
			generatorServices.getActiveAddresses(password, backUp, changePath, function(changeAddresses) {
				if(changeAddresses.length > 0)
					$scope.textArea += 'Change addresses:\n' + changeAddresses + '\n\n';
				else
					$scope.textArea += 'No CHange addresses available.' + '\n';
			});
		}
		else{
			$scope.textArea = validation;
		}
	}
});


