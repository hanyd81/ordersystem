
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
            
            
            var myRequest = new Request('/api/orders/:orderId', { 
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
               message=newServe + "  " + newName + "  added to the order";
               //alert(message);
               $(".modal-body p").text(message);
               $("#myModal").modal({});
               /* add number beside My order btn---------------------
               let orderbtn=$("#tableNav li:contains('My Order')");
               orderbtn.css("color","red");
               if(!orderbtn.data("meals")){
                   console.log("no meals yet");
                    orderbtn.data("meals",{no:1});}
                    
               let orderNum=parseInt(orderbtn.data("meals").no)+1;
               console.log(orderNum);
               let mealMesg="<span>"+orderNum+"</span>";
               orderbtn.append(mealMesg);
               //--------------------------------------*/
                $(inputId).val(0);
            });
        }
        
    }
    
    function fullFillMeal(orderId,mealId){
    let route='/api/orders/'+orderId;
    let btnId='#'+orderId+mealId;
        var myRequest = new Request(route, { 
            method: 'PUT',
            body: JSON.stringify({mealId:mealId}),
            headers: {
                'Content-Type': 'application/json'
            } 
        });
        fetch(myRequest).then(function(response) {
             return response.json()
          }).then(function(json){
              console.log(json); 
              $(btnId).removeClass("btn-danger");
              $(btnId).addClass("btn-secondary");
              
          });
    
    }

