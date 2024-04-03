const msjError = document.getElementsByName("error")[0];

document.getElementById('login-form').addEventListener('submit',async (e)=>{
    e.preventDefault();
    const user = e.target.children.user.value;
    const password = e.target.children.password.value;
    const res = await fetch("http://192.168.3.122:4000/api/login",{
        method: 'POST',
        headers : {
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            user, password
        })
    });
    if(!res.ok) return msjError.classList.toggle("escondido",false);
    const resJson = await res.json();
    if(resJson.redirect) window.location.href = resJson.redirect;
});