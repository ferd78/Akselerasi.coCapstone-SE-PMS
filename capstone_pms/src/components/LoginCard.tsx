const LoginCard = () => {
  return (
    <div className="h-90 w-84 bg-primary rounded-xl shadow-lg px-1 pt-10">
        <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-bold text-shadow-sm text-tertiary text-center"> User Login </h1>
            <form className="flex flex-col w-85/100">
                <input placeholder="Username" className="p-3 bg-quartenary rounded-xl shadow-xs font-medium outline-none mb-4"></input>
                <input placeholder="Password" className="p-3 bg-quartenary rounded-xl shadow-xs font-medium outline-none mb-4"></input>
                <button type="submit" className="bg-secondary p-3 rounded-xl shadow-xs text-md text-white font-semibold hover:bg-blue-600 hover:cursor-pointer"> Login </button>
                <button type="button" className="text-tertiary text-sm hover:cursor-pointer hover:underline mt-6"> Forgot Password? </button>
            </form>
        </div>
    </div>
  )
}

export default LoginCard
