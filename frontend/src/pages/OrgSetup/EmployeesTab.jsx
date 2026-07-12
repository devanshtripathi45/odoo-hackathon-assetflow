import { useState, useEffect } from "react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

function getRoleBadgeClass(role) {
  switch (role) {
    case "ADMIN": return "badge-admin";
    case "ASSET_MANAGER": return "badge-asset-manager";
    case "DEPARTMENT_HEAD": return "badge-dept-head";
    default: return "badge-employee";
  }
}

function formatRole(role) {
  return role.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

export default function EmployeesTab() {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const fetchData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get("/employees"),
        api.get("/departments"),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const changeRole = async (empId, role) => {
    setSaving(empId);
    try {
      await api.put(`/employees/${empId}/role`, { role });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update role");
    } finally {
      setSaving(null);
    }
  };

  const changeDepartment = async (empId, departmentId) => {
    setSaving(empId);
    try {
      await api.put(`/employees/${empId}/department`, { departmentId: departmentId || null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update department");
    } finally {
      setSaving(null);
    }
  };

  const toggleStatus = async (emp) => {
    setSaving(emp.id);
    try {
      await api.patch(`/employees/${emp.id}/status`, {
        status: emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to toggle status");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{employees.length} employee(s)</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const isSelf = emp.id === currentUser?.id;
                const isAdmin = emp.role === "ADMIN";
                return (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-semibold">
                          {emp.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{emp.email}</td>
                    <td className="px-5 py-4">
                      {isAdmin || isSelf ? (
                        <span className="text-sm text-gray-600">{emp.department?.name || "—"}</span>
                      ) : (
                        <select
                          className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                          value={emp.departmentId || ""}
                          onChange={(e) => changeDepartment(emp.id, e.target.value)}
                          disabled={saving === emp.id}
                        >
                          <option value="">No Department</option>
                          {departments.filter((d) => d.status === "ACTIVE").map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isAdmin || isSelf ? (
                        <span className={getRoleBadgeClass(emp.role)}>{formatRole(emp.role)}</span>
                      ) : (
                        <select
                          className="text-sm border border-gray-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none"
                          value={emp.role}
                          onChange={(e) => changeRole(emp.id, e.target.value)}
                          disabled={saving === emp.id}
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="DEPARTMENT_HEAD">Department Head</option>
                          <option value="ASSET_MANAGER">Asset Manager</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={emp.status === "ACTIVE" ? "badge-active" : "badge-inactive"}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isSelf && !isAdmin && (
                        <button
                          onClick={() => toggleStatus(emp)}
                          disabled={saving === emp.id}
                          className={`btn-sm text-xs ${emp.status === "ACTIVE" ? "btn-danger" : "btn-primary"}`}
                        >
                          {saving === emp.id ? "..." : emp.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
