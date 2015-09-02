var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services"]);
app.controller("addressGeneratorController",function($scope, generatorServices){
	$scope.generate = function(){
		var bck = $scope.bck;
		var pwd = $scope.pwd;
		$scope.textbox = [];
		var validation = generatorServices.validate(bck,pwd);
		if(validation == true){
		generatorServices.getActiveAddresses(pwd,bck,function(addrs) {
				$scope.textbox = addrs;
		})
		}
		else{
			$scope.textbox= validation;
		}
	}
});


