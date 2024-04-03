const msjError = document.getElementByName("error")[0];

document.getElementById("formulario").addEventListener("submit",async(e) => {
    e.preventDefault();
    console.log(e.target.children.inputName.value);

    const res = await fetch("http://192.168.3.122:4000/api/register",{
        method : "POST",
        headers : {
            "content-type" : "application/json"
        },
        body: JSON.stringify({
            name : e.target.children.inputName.value,
            lastName : e.target.children.inputLastName.value,
            legajo : e.target.children.inputLegajo.value,
            puesto : e.target.children.inputPuesto.value,
            email : e.target.children.inputEmail.value,
            passUser : e.target.children.inputPassUser.value,
            legajoPat : e.target.children.inputUserPatron.value,
            passUserPat : e.target.children.inputPassPatron.value
        })
    });

    if(!res.ok) return msjError.classList.toggle("escondido",false);
    const resJson = await res.json();
    if(resJson.redirect) window.location.href = resJson.redirect;
});