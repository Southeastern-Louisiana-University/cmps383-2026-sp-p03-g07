import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { rewardsService } from '@/services/rewardsService';
import type { PointsBalance, Reward } from '@/types/app';

type RewardsContextValue = {
  balance: PointsBalance | null;
  rewards: Reward[];
  refresh: () => Promise<void>;
};

const RewardsContext = createContext<RewardsContextValue | null>(null);

export function RewardsProvider({ children }: PropsWithChildren) {
  const [balance, setBalance] = useState<PointsBalance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  async function refresh() {
    const nextRewards = await rewardsService.getRewards();
    setRewards(nextRewards);

    try {
      const nextBalance = await rewardsService.getBalance();
      setBalance(nextBalance);
    } catch {
      setBalance(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo<RewardsContextValue>(
    () => ({ balance, rewards, refresh }),
    [balance, rewards],
  );

  return createElement(RewardsContext.Provider, { value }, children);
}

export function useRewards() {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within RewardsProvider');
  }

  return context;
}
