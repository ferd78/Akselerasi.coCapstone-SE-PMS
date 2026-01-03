import { useState } from "react";

/* Toggle Switch Component */
const Toggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
      checked ? "bg-blue-600" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const AdminConfiguration = () => {
  const [config, setConfig] = useState({
    anonymousFeedback: true,
    feedbackReminders: true,
    minFeedbackResponses: 3,

    reviewReminders: true,
    reviewNotificationDays: 7,
    performanceScale: "5-point",

    rewardsModule: true,
    developmentPlanRequired: true,
  });

  const handleSave = () => {
    console.log("Saved configuration:", config);
    alert("Configuration saved successfully!");
  };

  return (
    <div className="flex justify-center px-6 py-10">
      {/* MAIN CONTAINER */}
      <div className="w-full max-w-4xl space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold">System Configuration</h1>
          <p className="text-sm text-gray-500">
            Manage system-wide settings and preferences
          </p>
        </div>

        {/* GENERAL SETTINGS */}
        <div className="bg-white border rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold">General Settings</h2>

          <div className="space-y-4">
            <h3 className="font-medium">Feedback Settings</h3>

            {/* Anonymous Feedback */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Anonymous Feedback</p>
                <p className="text-sm text-gray-500">
                  Allow reviewers to submit feedback anonymously
                </p>
              </div>
              <Toggle
                checked={config.anonymousFeedback}
                onChange={(val) =>
                  setConfig({ ...config, anonymousFeedback: val })
                }
              />
            </div>

            {/* Feedback Reminders */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Feedback Deadline Reminders</p>
                <p className="text-sm text-gray-500">
                  Send automatic reminders for pending feedback
                </p>
              </div>
              <Toggle
                checked={config.feedbackReminders}
                onChange={(val) =>
                  setConfig({ ...config, feedbackReminders: val })
                }
              />
            </div>

            {/* Minimum Responses */}
            <div>
              <p className="font-medium mb-1">
                Minimum Feedback Responses Required
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Minimum number of feedback responses needed for aggregation
              </p>
              <input
                type="number"
                min={1}
                value={config.minFeedbackResponses}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    minFeedbackResponses: Number(e.target.value),
                  })
                }
                className="w-24 border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* REVIEW SETTINGS */}
        <div className="bg-white border rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold">Review Settings</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Automatic Review Reminders</p>
              <p className="text-sm text-gray-500">
                Send reminders to managers for pending reviews
              </p>
            </div>
            <Toggle
              checked={config.reviewReminders}
              onChange={(val) =>
                setConfig({ ...config, reviewReminders: val })
              }
            />
          </div>

          <div>
            <p className="font-medium mb-1">
              Review Cycle Notification (Days Before)
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Number of days before cycle start to send notifications
            </p>
            <input
              type="number"
              min={1}
              value={config.reviewNotificationDays}
              onChange={(e) =>
                setConfig({
                  ...config,
                  reviewNotificationDays: Number(e.target.value),
                })
              }
              className="w-24 border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <p className="font-medium mb-2">Performance Scale Type</p>
            <select
              value={config.performanceScale}
              onChange={(e) =>
                setConfig({ ...config, performanceScale: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            >
              <option value="5-point">5-Point Scale</option>
              <option value="4-point">4-Point Scale</option>
              <option value="percentage">Percentage</option>
            </select>
          </div>
        </div>

        {/* MODULE SETTINGS */}
        <div className="bg-white border rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-semibold">Module Settings</h2>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Rewards Module</p>
              <p className="text-sm text-gray-500">
                Enable rewards and recognition functionality
              </p>
            </div>
            <Toggle
              checked={config.rewardsModule}
              onChange={(val) =>
                setConfig({ ...config, rewardsModule: val })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Development Plans Required</p>
              <p className="text-sm text-gray-500">
                Require development plans for all performance reviews
              </p>
            </div>
            <Toggle
              checked={config.developmentPlanRequired}
              onChange={(val) =>
                setConfig({ ...config, developmentPlanRequired: val })
              }
            />
          </div>
        </div>

        {/* SAVE */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfiguration;
