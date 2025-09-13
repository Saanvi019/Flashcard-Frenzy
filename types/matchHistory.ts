export interface MatchHistory {
  matchId: string;         
  player1Id: string;      
  player2Id: string;      
  score1: number;         
  score2: number;         
  winnerId: string | null; 
  totalRounds: number;    
  createdAt: Date;        
  completedAt: Date;      
}