function toggleMenu() {

    document.getElementById("sidebar").classList.toggle("open");

}

const menuItems = document.querySelectorAll(".sidebar a");

menuItems.forEach(function(item){

    item.addEventListener("click", function(e){

        if(this.id === "logout"){
            return;
        }

        menuItems.forEach(function(link){

            link.classList.remove("active");

        });

        this.classList.add("active");

    });

});

document.getElementById("logout").addEventListener("click", function(e){

    e.preventDefault();

    let confirmLogout = confirm("Are you sure you want to logout?");

    if(confirmLogout){

        alert("You have been logged out.");

    }

});