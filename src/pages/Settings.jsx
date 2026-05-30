import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getSettings, updateSettings } from "../services/settingsService";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const [kundaliRate, setKundaliRate] = useState("");
  const [aiChatRate, setAiChatRate] = useState("");
  const [dailyHoroscopeRate, setDailyHoroscopeRate] = useState("");
  const [weeklyHoroscopeRate, setWeeklyHoroscopeRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { admin } = useAuth();
  
  // Superadmin check - optional depending on how strict you want UI to be
  // but backend already restricts PUT /api/admin/settings to superadmin.
  const isSuperAdmin = admin?.role === "superadmin";

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      if (data.success && data.settings) {
        setKundaliRate(data.settings.kundaliRate);
        if(data.settings.aiChatRate !== undefined) {
          setAiChatRate(data.settings.aiChatRate);
        }
        if(data.settings.dailyHoroscopeRate !== undefined) {
          setDailyHoroscopeRate(data.settings.dailyHoroscopeRate);
        }
        if(data.settings.weeklyHoroscopeRate !== undefined) {
          setWeeklyHoroscopeRate(data.settings.weeklyHoroscopeRate);
        }
      }
    } catch (error) {
      toast.error(error || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only Superadmin can update settings");
      return;
    }

    try {
      setSaving(true);
      const data = await updateSettings({
        kundaliRate: Number(kundaliRate),
        aiChatRate: Number(aiChatRate),
        dailyHoroscopeRate: Number(dailyHoroscopeRate),
        weeklyHoroscopeRate: Number(weeklyHoroscopeRate)
      });
      
      if (data.success) {
        toast.success("Settings updated successfully!");
        setKundaliRate(data.settings.kundaliRate);
        if(data.settings.aiChatRate !== undefined) {
          setAiChatRate(data.settings.aiChatRate);
        }
        if(data.settings.dailyHoroscopeRate !== undefined) {
          setDailyHoroscopeRate(data.settings.dailyHoroscopeRate);
        }
        if(data.settings.weeklyHoroscopeRate !== undefined) {
          setWeeklyHoroscopeRate(data.settings.weeklyHoroscopeRate);
        }
      }
    } catch (error) {
      toast.error(error || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Global App Settings</h1>
        <p className="text-gray-500 mt-1">Manage pricing, limits, and other global configurations.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Pricing Configuration</h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Kundali Rate Input */}
            <div className="col-span-1">
              <label htmlFor="kundaliRate" className="block text-sm font-medium text-gray-700 mb-2">
                Kundali Generation Rate (₹)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="kundaliRate"
                  id="kundaliRate"
                  min="0"
                  required
                  value={kundaliRate}
                  onChange={(e) => setKundaliRate(e.target.value)}
                  disabled={!isSuperAdmin || saving}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This amount will be deducted from user's wallet every time they generate a Kundali.
              </p>
            </div>
            
            
            {/* AI Chat Rate Input */}
            <div className="col-span-1">
              <label htmlFor="aiChatRate" className="block text-sm font-medium text-gray-700 mb-2">
                AI Astrologer Chat Rate (₹)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="aiChatRate"
                  id="aiChatRate"
                  min="0"
                  required
                  value={aiChatRate}
                  onChange={(e) => setAiChatRate(e.target.value)}
                  disabled={!isSuperAdmin || saving}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This amount will be deducted from user's wallet per message after their free limit is over.
              </p>
            </div>

            {/* Daily Horoscope Rate Input */}
            <div className="col-span-1">
              <label htmlFor="dailyHoroscopeRate" className="block text-sm font-medium text-gray-700 mb-2">
                Daily Horoscope Rate (₹)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="dailyHoroscopeRate"
                  id="dailyHoroscopeRate"
                  min="0"
                  required
                  value={dailyHoroscopeRate}
                  onChange={(e) => setDailyHoroscopeRate(e.target.value)}
                  disabled={!isSuperAdmin || saving}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This amount will be deducted from user's wallet every time they check their Daily Horoscope.
              </p>
            </div>

            {/* Weekly Horoscope Rate Input */}
            <div className="col-span-1">
              <label htmlFor="weeklyHoroscopeRate" className="block text-sm font-medium text-gray-700 mb-2">
                Weekly Horoscope Rate (₹)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="weeklyHoroscopeRate"
                  id="weeklyHoroscopeRate"
                  min="0"
                  required
                  value={weeklyHoroscopeRate}
                  onChange={(e) => setWeeklyHoroscopeRate(e.target.value)}
                  disabled={!isSuperAdmin || saving}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                This amount will be deducted from user's wallet every time they check their Weekly Horoscope.
              </p>
            </div>
            
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6 flex items-center justify-between">
            {!isSuperAdmin && (
              <span className="text-sm text-red-500 font-medium">
                * You must be a Superadmin to edit settings.
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={!isSuperAdmin || saving}
                className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
