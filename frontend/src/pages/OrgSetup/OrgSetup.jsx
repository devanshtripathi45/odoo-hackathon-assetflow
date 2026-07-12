import { useState } from "react";
import { Building2, FolderKanban, Users } from "lucide-react";
import DepartmentsTab from "./DepartmentsTab";
import CategoriesTab from "./CategoriesTab";
import EmployeesTab from "./EmployeesTab";

const tabs = [
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "categories", label: "Asset Categories", icon: FolderKanban },
  { id: "employees", label: "Employee Directory", icon: Users },
];

export default function OrgSetup() {
  const [activeTab, setActiveTab] = useState("departments");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Organization Setup</h1>
        <p className="text-gray-500 mt-1">Configure departments, asset categories, and manage employees</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 ${activeTab === tab.id ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "departments" && <DepartmentsTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "employees" && <EmployeesTab />}
    </div>
  );
}
