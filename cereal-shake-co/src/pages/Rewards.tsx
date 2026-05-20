import { useState } from "react";
import { motion } from "framer-motion";
import {
  Gift, Star, Trophy, Zap, Clock, CheckCircle2,
  Lock, Crown, Flame, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const TIERS = [
  { name: "Shake Fan",   min: 0,    max: 499,  color: "amber",  icon: Star,   perks: ["10 pts per $1", "Birthday shake"] },
  { name: "Shake Pro",   min: 500,  max: 1499, color: "orange", icon: Flame,  perks: ["12 pts per $1", "Free delivery on $20+", "Priority support"] },
  { name: "Shake Elite", min: 1500, max: 2999, color: "purple", icon: Crown,  perks: ["15 pts per $1", "Free delivery always", "Monthly bonus shake", "Early access"] },
  { name: "Shake God",   min: 3000, max: Infinity, color: "yellow", icon: Trophy, perks: ["20 pts per $1", "Free delivery always", "Weekly free shake", "VIP support", "Custom shakes"] },
];

function getTier(points: number) {
  return TIERS.find((t) => points >= t.min && points <= t.max) ?? TIERS[0];
}

function getTierProgress(points: number) {
  const tier = getTier(points);
  if (tier.max === Infinity) return 100;
  return Math.min(100, ((points - tier.min) / (tier.max - tier.min)) * 100);
}

function getNextTier(points: number) {
  const idx = TIERS.findIndex((t) => points >= t.min && points <= t.max);
  return TIERS[idx + 1] ?? null;
}

export default function Rewards() {
  const navigate = useNavigate();
  const [redeeming, setRedeeming] = useState<number | null>(null);

  const { data: balance, refetch: refetchBalance } = trpc.rewards.balance.useQuery();
  const { data: history } = trpc.rewards.history.useQuery();
  const { data: rewardsList } = trpc.rewards.list.useQuery();
  const redeemMutation = trpc.rewards.redeem.useMutation();

  const pts = balance?.balance ?? 0;
  const tier = getTier(pts);
  const progress = getTierProgress(pts);
  const nextTier = getNextTier(pts);
  const TierIcon = tier.icon;

  const handleRedeem = async (rewardId: number, cost: number) => {
    if (pts < cost) { toast.error("Not enough points"); return; }
    setRedeeming(rewardId);
    try {
      await redeemMutation.mutateAsync({ rewardId });
      toast.success("Reward redeemed! Check your orders page for your discount code 🎉");
      refetchBalance();
    } catch (e: any) {
      toast.error(e.message ?? "Redemption failed");
    } finally {
      setRedeeming(null);
    }
  };

  const tierColors: Record<string, string> = {
    amber:  "from-amber-400 to-amber-600",
    orange: "from-orange-400 to-orange-600",
    purple: "from-purple-400 to-purple-600",
    yellow: "from-yellow-300 to-amber-500",
  };

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-b from-amber-50/50 to-white pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero Points Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl bg-gradient-to-br ${tierColors[tier.color]} p-8 text-white shadow-2xl shadow-amber-500/20 mb-8`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TierIcon className="w-5 h-5" />
                <span className="text-white/80 font-semibold text-sm">{tier.name}</span>
              </div>
              <div className="text-6xl font-black">{pts.toLocaleString()}</div>
              <div className="text-white/70 mt-1">Total Points</div>
            </div>
            <div className="text-right">
              <div className="text-white/70 text-sm">Lifetime earned</div>
              <div className="text-2xl font-black">{balance?.lifetimeEarned?.toLocaleString() ?? 0}</div>
            </div>
          </div>

          {/* Tier progress bar */}
          {nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>{tier.name}</span>
                <span>{nextTier.name} in {(nextTier.min - pts).toLocaleString()} pts</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-2.5 bg-white rounded-full"
                />
              </div>
            </div>
          )}

          {!nextTier && (
            <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
              <Crown className="w-4 h-4" />
              You've reached the highest tier! 🏆
            </div>
          )}
        </motion.div>

        {/* ── Tier perks ── */}
        <div className="grid sm:grid-cols-4 gap-4 mb-10">
          {TIERS.map((t, i) => {
            const isActive = tier.name === t.name;
            const isUnlocked = pts >= t.min;
            const Icon = t.icon;
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-4 transition-all ${
                  isActive
                    ? "border-amber-400 bg-amber-50 shadow-lg shadow-amber-100/50"
                    : isUnlocked
                    ? "border-green-200 bg-green-50/50"
                    : "border-gray-100 bg-gray-50/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-amber-500" : isUnlocked ? "text-green-500" : "text-gray-300"}`} />
                  <span className={`font-bold text-sm ${isActive ? "text-amber-900" : isUnlocked ? "text-green-800" : "text-gray-400"}`}>
                    {t.name}
                  </span>
                  {isActive && <span className="ml-auto text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">Current</span>}
                  {!isUnlocked && <Lock className="w-3.5 h-3.5 ml-auto text-gray-300" />}
                  {isUnlocked && !isActive && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-green-500" />}
                </div>
                <div className="text-xs text-gray-400 mb-2">{t.min.toLocaleString()}+ pts</div>
                <ul className="space-y-1">
                  {t.perks.map((perk) => (
                    <li key={perk} className={`text-xs flex items-start gap-1 ${isUnlocked ? "text-gray-700" : "text-gray-400"}`}>
                      <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* ── Redeemable Rewards ── */}
        <h2 className="text-2xl font-black text-amber-900 mb-4">Redeem Points</h2>
        {rewardsList && rewardsList.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {rewardsList.map((reward, i) => {
              const canAfford = pts >= reward.pointsCost;
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className={`bg-white rounded-2xl border p-5 transition-all ${
                    canAfford ? "border-amber-200 hover:shadow-lg hover:shadow-amber-50" : "border-gray-100 opacity-70"
                  }`}
                >
                  {reward.image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-amber-50">
                      <img src={reward.image} alt={reward.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!reward.image && (
                    <div className="w-full h-24 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-3 text-4xl">
                      🎁
                    </div>
                  )}
                  <h3 className="font-bold text-amber-900">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-amber-600 text-xs mt-1">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-black text-amber-700">{reward.pointsCost.toLocaleString()} pts</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canAfford || redeeming === reward.id}
                      onClick={() => handleRedeem(reward.id, reward.pointsCost)}
                      className={`rounded-xl text-xs font-bold ${
                        canAfford
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {redeeming === reward.id ? "Redeeming..." : canAfford ? "Redeem" : <><Lock className="w-3 h-3 mr-1" /> Need {(reward.pointsCost - pts).toLocaleString()} more</>}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-amber-400">
            <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-amber-600">No rewards available yet — check back soon!</p>
          </div>
        )}

        {/* ── Points History ── */}
        <h2 className="text-2xl font-black text-amber-900 mb-4">Points History</h2>
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          {history && history.length > 0 ? (
            <div className="divide-y divide-amber-50">
              {history.map((entry: any, i: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.type === "earned" ? "bg-green-100" :
                    entry.type === "redeemed" ? "bg-amber-100" :
                    entry.type === "bonus" ? "bg-purple-100" : "bg-red-100"
                  }`}>
                    {entry.type === "earned"   && <Zap className="w-4 h-4 text-green-600" />}
                    {entry.type === "redeemed" && <Gift className="w-4 h-4 text-amber-600" />}
                    {entry.type === "bonus"    && <Star className="w-4 h-4 text-purple-600" />}
                    {entry.type === "expired"  && <Clock className="w-4 h-4 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-amber-900 text-sm truncate">{entry.description}</div>
                    <div className="text-xs text-amber-400 mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  <div className={`font-black text-sm ${entry.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {entry.points > 0 ? "+" : ""}{entry.points} pts
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-amber-300">
              <Clock className="w-10 h-10 mx-auto mb-3" />
              <p className="text-amber-500">No points history yet</p>
              <Button onClick={() => navigate("/menu")} className="mt-4 bg-amber-500 hover:bg-amber-600 rounded-xl">
                Start earning
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
