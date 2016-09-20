function updatePercentage() {
var sum = ($('.greenBalance').html()*1)+($('.greyBalance').html()*1);
if(sum>0) {
	var percent=Math.round(((1/sum)*($('.greenBalance').html()*1))*100);
	console.log(percent);
	$('.greenPercent').html(percent+"%");
}
}
$('#btnBalance').click(
	function() {		
		gsi.app.balanceOfGreen($('#address').val(),function(balance) {
			$('.greenBalance').html(balance);
			updatePercentage();
		});		
		gsi.app.balanceOfGrey($('#address').val(),function(balance) {
			$('.greyBalance').html(balance);
			updatePercentage();
			});		
	}
);

$(document).ready( function() {
	// Not required - but speed it up :) 
	//gsi.app.forceLogin(function() {console.log("Loaded SmartContract");});
});