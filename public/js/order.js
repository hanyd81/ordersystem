
//var mealsInOrder=[];

function takeOrder(newName, newPicture, newPrice, id) {
    inputId = '#' + id;
    newServe = parseInt($(inputId).val());
    if(newServe>0){
        var meal = {
            name: newName,
            picture: newPicture,
            price: newPrice,
            serve: newServe,
            filled: false
        };
       // mealsInOrder.push(meal);
        alert(newServe + " " + newName + " added to the order");
        
        var myRequest = new Request('/api/order/:orderId', { 
            method: 'POST',
            body: JSON.stringify(meal),
            headers: {
                'Content-Type': 'application/json'
            } 
        });
        fetch(myRequest).then(function(response) {
          // return response.json()
        }).then(function(json){
           // console.log(json); 
            $(inputId).val(0);
        });
    }
    
}

function updateOrder(id){

}