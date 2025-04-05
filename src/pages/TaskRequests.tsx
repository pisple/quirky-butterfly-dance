
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TaskRequestForm from "@/components/TaskRequestForm";
import { UserType } from "@/types";

const TaskRequests = () => {
  const [userType, setUserType] = useState<UserType>("elderly");
  
  useEffect(() => {
    // Get user type from localStorage
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "elderly" || savedUserType === "helper") {
      setUserType(savedUserType);
    }
  }, []);

  return (
    <div className={`flex flex-col min-h-screen ${userType === "elderly" ? "elderly-mode" : ""}`}>
      <Header userType={userType} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Demander de l'aide
        </h1>
        
        <TaskRequestForm />
      </main>
      
      <Footer />
    </div>
  );
};

export default TaskRequests;
