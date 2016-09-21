
$('#btnCommit').click(
	function() {		
		if($('#reading').val()*1>0) {
			gsi.app.commitReading(($('#reading').val())*1,function(e) {$('txId').html(e);});
			$('#reading').val("");
		}
	}
);

$(document).ready( function() {
	// Not required - but speed it up :) 
	//gsi.app.forceLogin(function() {console.log("Loaded SmartContract");});
});