export interface Reference {
  ref: string;
  tags: string[];
  owner: string;
}

export interface Statement {
  parents: Reference[];
  kids: Reference[];
  owner: string;
  text: string;
  tags: string[];
  scoring: any[];
  ranking_kids: any[];
  counter: number;
}

export interface Collection {
  [sid: string]: Statement;
}
