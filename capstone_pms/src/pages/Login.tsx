import LoginCard from "../components/LoginCard"


const Login = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src="/logo.svg" className="w-44 h-auto absolute top-1 left-1"/>
      
      <div className="flex items-center justify-center h-screen">
        <LoginCard/>          
      </div>
      
      <div className="">
         <img src="/bg.svg" className="absolute bottom-0   "/>
      </div>
     
    </div>
  )
}

export default Login
