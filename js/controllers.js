var app = angular.module("addressGeneratorApp",['addressGeneratorApp.services']);
app.controller("addressGeneratorController",function($scope,generatorServices){
	$scope.generate = function(){
	var bck = $scope.bck;
	var pwd = $scope.pwd;
	var validation = generatorServices.validate(bck,pwd);
	if(validation == true){
	var xPrivKey = generatorServices.getXPrivKey(pwd,bck);
	var addr = generatorServices.getAddress(xPrivKey);
	$scope.textbox = addr;
	}
	else{
		$scope.textbox= validation;
	}
};
});


