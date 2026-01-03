import { Card } from "@heroui/react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { resolveEmployeeId } from "../utils/resolveEmployeeId";
import {
  collection,
  query,
  where,
  getDocs,
  CollectionReference,
} from "firebase/firestore";
import { db } from "../firebase";

const DevelopmentPlanSummary = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any | null>(null);
  const [focusAreas, setFocusAreas] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchPlan = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const employeeId = await resolveEmployeeId(user);
        const dpSnap = await getDocs(
          query(
            collection(db, "developmentPlans"),
            where("employeeId", "==", employeeId)
          )
        );

        if (!mounted) return;

        if (dpSnap.empty) {
          setPlan(null);
          setFocusAreas([]);
          return;
        }

        const dpDoc = dpSnap.docs[0];
        const dpData = dpDoc.data();
        setPlan(dpData);
        if (Array.isArray(dpData.focusAreas)) {
          setFocusAreas(dpData.focusAreas);
        } else {
          const faSnap = await getDocs(
            collection(db, "developmentPlans", dpDoc.id, "focusAreas")
          );

          const resolvedFocusAreas = [];

          for (const fa of faSnap.docs) {
            const aiSnap = await getDocs(
              collection(
                db,
                "developmentPlans",
                dpDoc.id,
                "focusAreas",
                fa.id,
                "actionItems"
              )
            );

            resolvedFocusAreas.push({
              id: fa.id,
              ...fa.data(),
              actionItems: aiSnap.docs.map((d) => d.data()),
            });
          }

          if (!mounted) return;
          setFocusAreas(resolvedFocusAreas);
        }
      } catch (err) {
        console.warn("Failed to load development plan", err);
        if (mounted) {
          setPlan(null);
          setFocusAreas([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPlan();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <Card className="p-6 border-border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl">Development Plan Status</h2>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm text-center py-4">
          Loading...
        </div>
      ) : plan ? (
        <div className="text-sm space-y-1">
          <div className="font-medium">
            {focusAreas[0]?.title || "Development Plan"}
          </div>

          <div className="text-xs text-gray-500">
            Status: {plan.status || "—"}
          </div>

          {focusAreas.length > 0 && (
            <div className="text-xs text-gray-500">
              Focus Areas: {focusAreas.length}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 text-sm text-center py-4">
          No development plan assigned
        </div>
      )}
    </Card>
  );
};

export default DevelopmentPlanSummary;