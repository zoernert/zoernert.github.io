function updateView() {
	if(gsi.status.login) {
			$('#privateKey').val(gsi.wallet.privateKey);
			$('#address').val(gsi.address);
	} else {
			$('#privateKey').val("");
			$('#address').val("");
	}	
}

$('#btnLogin').click(
	function() {
		gsi.app.login($('#privateKey').val());
		updateView();
	}
);

$('#btnRegister').click(
	function() {
		gsi.app.newKey();
		gsi.app.login();
		updateView();
	}
);

$('#btnLogout').click(
	function() {
		gsi.app.logout();
		updateView();
	}
);