function generate() {
	var pwd = document.getElementById('pwd').value;
	var bck = document.getElementById('bck').value;
	var num = document.getElementById('num').value;
	if(validate(pwd,bck,num)){
	var xPrivKey = decryptData(pwd,bck);
	var addr = generateAddress(xPrivKey, num);
	$("#textbox").val(addr);}
}
function validate(pwd,bck,num){
	if (bck == "" || pwd == "" || num == "") {
		$("#textbox").val("Please Enter values for all entry boxes.");
		return false;
	};
	if (num < 0) {
              $("#textbox").val("Please Enter a positive integer value for the number of addresses.");
              return false;
          };
	try {
		jQuery.parseJSON( bck );
	} catch(e) {
		$("#textbox").val("Your JSON is not valid, please copy only the text within (and including) the { } brackets around it.");
		return false;
	};
	var plain;
	try {
		plain = sjcl.decrypt(pwd, bck);
	} catch(e) {
		$("#textbox").val("Seems like your password is incorrect. Try again.");
		return false;
	};
	return true;
}
function decryptData(pwd,bck){
	return JSON.parse(sjcl.decrypt(pwd,bck).toString()).xPrivKey;
}

function generateAddress(xPrivKey, n){
	var bitcore = require('bitcore');
	var addr = [];
	var hdPrivateKey = bitcore.HDPrivateKey(xPrivKey);

	for (var i = 0; i < n; i++) {
		// private key derivation
		var derivedHdPrivateKey = hdPrivateKey.derive("m/45'/0/"+i);
		var derivedPrivateKey = derivedHdPrivateKey.privateKey;
		// public key derivation
		var derivedHdPublicKey = derivedHdPrivateKey.hdPublicKey;
		var derivedPublicKey = derivedHdPublicKey.publicKey;
		var address = derivedPublicKey.toAddress();
		addr += address.toString()+'\n';
	}
	return addr;
}