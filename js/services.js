var app = angular.module("addressApp",[]);
app.controller('addressController',[function(){
	return {
	    getXPrivKey : getXPrivKey,
	    getAddress: getAddress,
	    validate : validate
	}
}]);
