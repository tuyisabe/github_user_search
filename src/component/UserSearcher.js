import { useEffect, useState } from "react"
export default function UserSearcher(){
   const [username,setUsername]=useState(''),
   initialdatas={info:{},repo:[[],[],[]],initial:1,repoCount:''},
   rejectedData={info:{},repo:[],initial:2,repoCount:''},
   [user,setuserInfo]=useState(initialdatas),
   [recent,setRecent]=useState([]),
   [showcart,isShowCart]=useState(false),
   [cart,setCart]=useState([]),
   generalLink='https://api.github.com/',
   localS='recentSearch',cartLocal='_carts',
   convertKb=kb=>(kb>=1024*1024) ? Math.floor(kb/(1024*1024))+'Gb' : 
    (kb>=1024) ? Math.floor(kb/1024)+'Mb' : kb+'Kb',
   fetchData=async(link,meth)=>{
     let Fetch= await fetch(link,{
        method:meth,headers:{'Content-Type': 'application/json'}
    }).then(res=>res.json())
    return Fetch; 
   },
   //function to get user details and user repository
   getGithubUser=async(e,vl)=>{
    vl=(typeof vl==='undefined') ? username : vl;
    e.preventDefault();showRepo(initialdatas);

       // function to get userDetails
    const getuserDetails=new Promise((resolve,reject)=>{
      fetchData(generalLink+'users/'+vl,'GET').then((usr)=>{
       if(usr.message=='Not Found'){reject(rejectedData)}
       else{resolve(usr)}
    }).catch((res)=>{reject(rejectedData)});
}),

       //function to get user repository
   getUserRep=new Promise((resolve,reject)=>{
    fetchData(generalLink+'users/'+vl+"/repos",'GET')
    .then((usr)=>{
           if(usr.message=='Not Found'){reject(rejectedData)}
           else{resolve(usr)}
        })
    .catch((res)=>{reject(rejectedData)});
    });

// combining userRepository and userDetails
await Promise.allSettled([getuserDetails,getUserRep]).then((data)=>{
    let datas=JSON.parse(JSON.stringify(data));datas.repoCount='0';
    datas.repo=[];datas.info={};
    if(data[0].status=='fulfilled'){datas.info=data[0].value}
    if(data[1].status=='fulfilled'){datas.repo=data[1].value;datas.repoCount=datas.repo.length;}
    showRepo(datas);
})
   }
function showRepo(datas){
    console.log(datas);
    let repos=[],repTitle=datas.repoCount<2 ? 'Repository' :'Repositories';
     repTitle=(datas.repoCount=='') ? '' :datas.repoCount+" "+repTitle;
    let classEmpty=(datas.repoCount=='') ? 'emptyClass' : '' ;
    datas.repo.forEach((rp,i)=> {
      repos[i]=<div key={i} className={"repoData "+classEmpty}>
          <a target='_blank' href={rp.homepage}>{rp.name}</a>
          <a className="linkX_rep" target='_blank' href={rp.url}>{rp.url}</a>
          <div className="repL">{rp.description}</div>
          <div className="repL">
              <p onClick={e=>{addToCart(e,rp)}} className="spanB dsds">{convertKb(rp.size)}</p>
              {rp.language!==null && <span className="spanB scBV">{rp.language}</span> }
              <span className="spanB">{rp.visibility}</span>
          </div>
      </div>   
    });

    datas.infos=<div className={"userProfile "+classEmpty}>
    <div className="userAvatar">
       <img  data-src={datas.info.avatar_url} className='userAvatarImg imgL'/>
    </div>
    <div className="user-details">
   <span className="username-0 unfo">{ (typeof datas.info.login!=='undefined') && datas.info.login+" / "+datas.info.name}</span>
   <div className="unfo"><span className="SpN1">Bio </span> {datas.info.bio}</div>
   <div className="unfo"><span className="SpN1">Email</span> {datas.info.email}</div>
   <div className="unfo"><span className="SpN1">Location</span> {datas.info.location}</div>
   </div>
</div>;

datas.repos=<div className="userRepository">
<h2 className="rep_title">{repTitle}</h2>
{repos}
</div>
setuserInfo(datas);
}

//save recent datas on localstorage and cart data

async function saveRecent(e,vl,lcl,crt=false){
    e.preventDefault();
 vl=(typeof vl==='undefined') ? username : vl;
 lcl=(typeof lcl==='undefined') ? localS : lcl;
  let   datas=localStorage.getItem(lcl);
 if(datas==null){localStorage.setItem(lcl,JSON.stringify([vl]))}
 else{
    datas=JSON.parse(datas);
 var filter=datas.map((dt,i)=>{
  if (crt==true){
   let dtName=dt.owner.login+dt.name,vlName=vl.owner.login+vl.name;
    if(dtName==vlName){return {index:i,value:dt};}
  }else{if(dt==vl){return {index:i,value:dt};}} 
 }).filter(dt=>typeof dt !== 'undefined');
 if(filter==0){datas.unshift(vl);}
 else{datas.splice(filter[0].index,1);datas.unshift(filter[0].value)}
 localStorage.setItem(lcl,JSON.stringify(datas));
 }
}

//add to cart and show cart
async function showCart(e){
    let datas=localStorage.getItem(cartLocal);
    if(datas!==null){
        datas=JSON.parse(datas);
        let arrx=datas.map((dt,i)=><li>{dt.owner.login+' / '+ dt.name}</li>);
        setCart(arrx);
    }
}
async function addToCart(e,rp,add=true){
 e.preventDefault();
await saveRecent(e,rp,cartLocal,true).then(()=>{showCart()})
}
// add events to show recent datas
   useEffect(()=>{
     let _image=document.querySelector('.imgL');
     if(_image!==null){
        if(typeof _image.dataset.src!=='undefined'){
         _image.src=_image.dataset.src;
         _image.onerror=()=>{var parent=_image.parentElement;
         parent.removeChild(_image)}
        }
   }
     //img
   },[user])
   useEffect(()=>{
    let searchFrm=document.querySelector('#searchFRm'),
    inputSearch=document.querySelector('#inputSearch'),
     form=document.querySelector('.realform');

    const removeRecent=e=>{searchFrm.classList.remove('searchActive');}
    const afterClick=(e,value)=>{removeRecent(e);setUsername(value)}
    const showRecent=(e)=>{
        let datas=localStorage.getItem(localS);
        if(datas!==null){
        searchFrm.classList.add('searchActive');
    let array_=JSON.parse(datas).map((dt,i)=><li key={i} onClick={e=>{getGithubUser(e,dt);saveRecent(e,dt);afterClick(e,dt)}}>{dt}</li>);
    setRecent(array_);
    }
    }
    
    inputSearch.addEventListener('mouseenter',showRecent);
    form.addEventListener('mouseleave',removeRecent);
        showCart();

    return ()=>{
    form.removeEventListener('mouseleave',removeRecent);
    inputSearch.removeEventListener('mouseenter',showRecent);
    }
   },[])

    return <div className="userSearcher">
        <div className="divCc_">
    <div className="searcher-title">
         Github username searcher
    </div>
     <div className="searchFrm" id="searchFRm">
         <form className="realform">
             <div className="form-container">
         <div className="search-container">
             <input autoComplete="false" id="inputSearch" value={username} onChange={e=>setUsername(e.target.value)}  placeholder="Enter Github username here"/>
             <button onClick={e=>{getGithubUser(e);saveRecent(e)}} className="button-find">Find</button>
             <div className="add-to-cart">
            <button className="cartButton" onClick={e=>{e.preventDefault();showCart();isShowCart(true)}} >{'Cart('+cart.length+')'}</button>
            {showcart && <ul className="Cart-List">
                <p className="p-close" onClick={e=>{isShowCart(false)}}>Close</p>
                <p className="cart-title">{'My Cart ('+cart.length+')'}</p>
                {cart}</ul>}
        </div>
        </div>
        <div className="search-recent">
            <ul className="ul-search">{recent}</ul>
        </div> 
        
        </div>
         </form>
    <div className="search-result">
     {user.infos}
     {user.repos}

    </div>
     </div>
    </div>
    </div>

}