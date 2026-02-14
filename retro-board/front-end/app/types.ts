export interface Card {
  id: number;
  title: string;
  description: string;
  position: number;
  createdAt: string;
  updatedAt: string;
  votes: number;
  column: {
    id: number;
    title: string;
  };
}

export interface ColumnType {
  id: number;
  name: string;
  position: number;
  board: {
    id: number;
    name: string;
  };
  cards: Card[];
}

export interface Board {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  team: {
    id: number;
    name: string;
  };
}
