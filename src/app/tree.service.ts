import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ContractService } from './contract.service';
import { Method } from './contract';
import { Collection } from './statement'

@Injectable({
  providedIn: 'root'
})
export class TreeService {

  server: string;
  agent: string;
  contract: string;
  public collection: Collection = {};
  public aggregateOrder = {};
  public notifiers = {};
  counter: number = 0;

  constructor(
    private contractService: ContractService,
  ) {
    this.collection['0'] = {
      'parents': [],
      'kids': [],
      'owner': '',
      'text': '',
      'tags': [],
      'scoring': [],
      'ranking_kids': [],
      'counter': 0
    }
    this.notifiers['0'] = new Subject<void>();
  }

  setScope(server, agent, contract) {
    this.server = server;
    this.agent = agent;
    this.contract = contract;
  }

  getUpdates() {
    let method = { name: 'get_updates', values: {'counter': this.counter}} as Method;
    this.contractService.read(this.server, this.agent, this.contract, method)
      .subscribe(collection => {
        console.log('updates received');
        let shouldUpdateRoot = false;
        Object.entries(collection as Collection).forEach(
          ([sid, statement]) => {
            if(statement['counter'] > this.counter) {
              this.counter = statement['counter'];
            }
            if (!(sid in this.collection)) {
              this.notifiers[sid] = new Subject<void>();
              if (statement.parents.length == 0) {
                this.collection['0'].kids.push({ 'ref': sid, 'tags': [], 'owner': '' });
                shouldUpdateRoot = true;
              }
            }
            this.collection[sid] = statement;
            this.setAggregatedOrder(sid);
            this.notifiers[sid].next();
          }
        );
        if (shouldUpdateRoot) {
          this.notifiers['0'].next();
        }
        console.log('root', this.collection['0']);
      });
  }

  setAggregatedOrder(sid) {
    this.aggregateOrder[sid] = [];
    let ranking = this.collection[sid]['ranking_kids'];
    let kids = this.collection[sid].kids.map(({ref, tags, owner}) => (ref));
    let n = kids.length;
    let indexes = {};
    let sum_matrix = [];
    for (let index in kids) {
      indexes[kids[index]] = index;
      sum_matrix.push(new Array(n).fill(0));
    }

    // pairwise compare matrix
    for (let order of Object.values(ranking)) {
      let unordered = new Set(kids);
      for (let above of order) {
        unordered.delete(above);
        for (let below of unordered) {
          let above_index = indexes[above];
          let below_index = indexes[below];
          sum_matrix[above_index][below_index] += 1;
        }
      }
    }

    // copeland score
    let copeland = [];
    for (let row = 0; row < n; ++row) {
      for (let col = row+1; col < n; ++col) {
        sum_matrix[row][col] = (sum_matrix[row][col] > sum_matrix[col][row]) ? 2 :
                                 ((sum_matrix[row][col] == sum_matrix[col][row]) ? 1 : 0);
        sum_matrix[col][row] = 2-sum_matrix[row][col];
      }
      copeland.push(sum_matrix[row].reduce((a,b) => a+b));
    }
    let order = Array.from(Array(n).keys());
    order.sort((a,b) => copeland[b]-copeland[a]);

    // smith sets
    let smith_sets = [];
    let row,col,lhs,rhs,prev;
    // loop on all sets
    for(rhs=1,lhs=0,prev=0;lhs<n;rhs=lhs+1) {
      // loop on a single set
      for(;lhs<rhs;lhs=rhs,rhs=row+1) {
        // include candidates wit the same copeland score
        for(;rhs<n&&copeland[order[rhs]]==copeland[order[rhs-1]];rhs++);
        // loop on rows and cols to find all zeros
        for(col=rhs,row=n;col==rhs&&row>=rhs;row--) {
          for(col=lhs;col<rhs&&sum_matrix[order[row-1]][order[col]]==0;col++);
        }
      }
      smith_sets.push(Array.from({length: (lhs - prev)}, (v, k) => kids[order[k + prev]]));
      prev = lhs;
    }

    this.aggregateOrder = smith_sets;
  }

  createStatement(sid, statement): void {
    const method = { name: 'create_statement',
                     values: {'parents': sid == '0' ? [] : [sid], 'text': statement, 'tags': []}} as Method;
    this.contractService.write(this.server, this.agent, this.contract, method)
      .subscribe();
  }

  setRanking(sid, order) {
    const method = { name: 'set_ranking',
                     values: {'sid': sid, 'order': order}} as Method;
    this.contractService.write(this.server, this.agent, this.contract, method).subscribe();
  }

}
