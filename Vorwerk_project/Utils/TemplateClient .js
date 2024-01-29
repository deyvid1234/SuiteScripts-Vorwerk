require(['N/record','N/search'],
	function(record, search){
       function aux(){
       		let results = [];
       		var mapResults = true
          	var mySearch = search.load({
                id: 'customsearch2107'
            });
            mySearch.run().each(function(result) {
		        results.push(result.getAllValues());
		        return true;
		    });
           
            console.log('results',results)
            return true;
        }
        aux()
});