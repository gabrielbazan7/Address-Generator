var app = angular.module("addressGeneratorApp",["addressGeneratorApp.services","ngLodash"]);
app.controller("addressGeneratorController",function($scope, generatorServices, transactionServices, lodash){
	var mainArray;
	var network;
	var changeArray;
	var transactionArray = [];
	var totalBalance = 0;
	var encrypt = 0;
	$scope.backUp = [];
	var m = $('#selectM').find('option:selected').attr('id');
	var n = $('#selectN').find('option:selected').attr('id');
	$('#selectN').change(function(){
		$("#button2").hide();
		n = $(this).find('option:selected').attr('id');
	});
	$scope.textArea = "";
	$scope.addr = "";
	$('#form2, #form3, #form4, #form5, #form6').hide();
	$('#XPriv1,#XPriv2,#XPriv3,#XPriv4,#XPriv5,#XPriv6').hide();
	$('#backupFile1,#backupFile2,#backupFile3,#backupFile4,#backupFile5,#backupFile6').hide();
	$('#selectM').change(function() {
		m = $(this).find('option:selected').attr('id');
		$('#form1, #form2, #form3, #form4, #form5, #form6').hide();
		for (var i = 1; i <= $(this).find('option:selected').attr('id'); i++) {
			$('#form' + i).show();
		}
	});

	$('.target').change(function(){
        for (var j=1; j<=m ;j++){
            if($('#check'+j).prop('checked')){
                $('#XPriv'+j).show();
            }
            else{
                $('#XPriv'+j).hide();
            }
        }
    });

	$('.targetFile').change(function(){
        for (var j=1; j<=m ;j++){
            if($('#checkFile'+j).prop('checked')){
                $('#backup'+j).hide();
                $('#backupFile'+j).show();
            }
            else{
                $('#backup'+j).show();
                $('#backupFile'+j).hide();
            }
        }
    });

    $scope.showContent = function($fileContent,index){
    		  	$scope.backUp[index] = $fileContent;
                $('#backup'+index).show();
                $('#backupFile'+index).hide();
                $('#checkFile'+index).prop('checked',false);
    };

	$scope.generate = function(){
		$("#messageError2").hide();
		$("#messageSuccess2").hide();
		$("#messageError").hide();
		$("#messageSuccess").hide();
		$("#button2").hide();
		$scope.messageError2 = "";
		$scope.messageSuccess2 = "";
		var backUps = [];
		var passwords = [];
		var passwordsXPrivKey = [];
		backUps.push($scope.backUp[1],$scope.backUp[2],$scope.backUp[3],$scope.backUp[4],$scope.backUp[5],$scope.backUp[6]);
		passwords.push($scope.password1,$scope.password2,$scope.password3,$scope.password4,$scope.password5,$scope.password6);
		passwordsXPrivKey.push($scope.passwordXPrivKey1,$scope.passwordXPrivKey2,$scope.passwordXPrivKey3,
							   $scope.passwordXPrivKey4,$scope.passwordXPrivKey5,$scope.passwordXPrivKey6);
		var copayersData = generatorServices.getCopayersData(backUps,passwords,passwordsXPrivKey);
		var validation = generatorServices.validation(copayersData, m, n);
		if(validation == true){
			var xPrivKeys = generatorServices.getXPrivKeys(copayersData);
			network = generatorServices.getNetwork(copayersData);
			var mainPath = "m/45'/2147483647/0/";
			var changePath = "m/45'/2147483647/1/";
			$scope.textArea = 'Searching main addresses...\n\n';
			generatorServices.getActiveAddresses(xPrivKeys, mainPath, n, network, function(mainAddressesObject) {
				if(mainAddressesObject.length > 0){
					mainArray = feedback(mainAddressesObject);
					mainArray = lodash.remove(mainArray,function (n){
						return !lodash.isUndefined(n);
					});
				$scope.textArea += 'Total main addresses with founds: ' + mainArray.length + '\n\n' +'*************************' + '\n';
				}
				else
					$scope.textArea += 'No Main addresses with BTC available.\n';
				$scope.textArea += 'Searching change addresses...\n\n';
				// getting change addresses
				generatorServices.getActiveAddresses(xPrivKeys, changePath, n, network, function(changeAddressesObject) {
				if(changeAddressesObject.length > 0){
					changeArray = feedback(changeAddressesObject);
					changeArray = lodash.remove(changeArray,function (n){
					return !lodash.isUndefined(n);
					});
					$scope.textArea += 'Total change addresses with founds: ' + changeArray.length + '\n';
				}
				else
					$scope.textArea += 'No Change addresses with founds available.\n\n';
				$("#button2").show();
				$("#messageSuccess2").show();
				$scope.messageSuccess2 = "Search completed";
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

	feedback = function(AddressesObject){
		mcArray = lodash.map(AddressesObject ,function(obj){
			if(obj.utxo.length>0){
				$scope.textArea += 'Address: ' + obj.address + '\n';
				$scope.textArea += 'Balance: ' + obj.balance + '\n';
				$scope.textArea += 'Unconfirmed balance: ' + obj.unconfirmedBalance + '\n';
				$scope.textArea += 'Path: ' + obj.path + '\n\n';
			}
			var utxos = [];
			var keys = [];
			for(var j=0; j<obj.utxo.length ;j++){
				utxos.push(obj.utxo[j]);
				totalBalance += obj.utxo[j].amount;
				keys.push(obj.keys);
			}	
			if(utxos.length>0){
				return {utxos: utxos,
						keys: keys}
			}
			else
				return;
		})
	return mcArray;
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
			transactionServices.txBroadcast(rawTx,network).then(function(response,err){
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


