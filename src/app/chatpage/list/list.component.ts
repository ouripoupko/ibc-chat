import { Component, OnInit, OnDestroy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { Collection } from '../../statement';
import { Method } from '../../contract';
import { FormControl } from '@angular/forms';
import { ContractService } from '../../contract.service';
import { TreeService } from '../../tree.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';

export interface TreeEvent {
  event: string;
  data: any;
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy {

  server: string;
  agent: string;
  contract: string;
  @Input() sid: string;
  private eventsSubscription: Subscription;
  @Input() events: Observable<TreeEvent>;
  kids: Collection = {};
  updateKids = {};
  order: string[] = [];
  rev_order: string[] = [];
  statementForm: FormControl = new FormControl();
  waiting = true;
  firstDrop = true;
  oldOrder = [];
  @Output() dropEvent = new EventEmitter<string>();
  @Input() aggregated;

  constructor(
    private contractService: ContractService,
    private treeService: TreeService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.server = decodeURIComponent(this.route.snapshot.paramMap.get('server'));
    this.agent = this.route.snapshot.paramMap.get('agent');
    this.contract = this.route.snapshot.paramMap.get('contract');
    this.eventsSubscription = this.events.subscribe((record) => {
      if(record['event'] == 'update') {
        this.getOrder();
        for(let sid of this.order) {
          this.updateKids[sid] = new Subject<TreeEvent>();
        }
        console.log('checkpoint', this.order, this.updateKids);
        Object.entries(record['data']['keys']).forEach(
          ([sid, paths]) => {
            if(sid in this.kids) {
              let event = {'event': "update",
                           'data': {'keys': paths, 'record': record['data']['record']}} as TreeEvent;
              this.updateKids[sid].next(event);
              this.getOrder();
            } else {
              this.getStatements();
              this.getOrder();
            }
          }
        );
      }
      else if(record['event'] == 'drop_done') {
        console.log('drop done: ' + record['data']);
        if(record['data']) {
          const method = { name: 'set_ranking',
                           values: {'sid': this.sid, 'order': this.order}} as Method;
          this.contractService.write(this.server, this.agent, this.contract, method)
            .subscribe();
        } else {
          this.order = Object.assign([], this.oldOrder);
        }
        this.oldOrder = [];
        this.firstDrop = true;
      }
      else {
        this.getStatements();
        this.getOrder();
      }
    });
  }

  ngOnDestroy() {
     this.eventsSubscription.unsubscribe();
  }

  submit() {
    this.createStatement(this.statementForm.value);
    this.statementForm.setValue("");
    this.waiting = true;
  }

  createStatement(statement): void {
    const method = { name: 'create_statement',
                     values: {'parents': this.sid ? [this.sid] : [], 'text': statement, 'tags': []}} as Method;
    this.contractService.write(this.server, this.agent, this.contract, method)
      .subscribe();
  }

  getStatements(): void {
    this.waiting = true;
    const method = { name: 'get_statements', values: {'parent': this.sid}} as Method;
    this.contractService.read(this.server, this.agent, this.contract, method)
      .subscribe(collection => {
//        this.order = [];
        this.rev_order = [];
        Object.entries(collection as Collection).forEach(
          ([sid, statement]) => {
//            if(!(sid in this.kids)) {
//              this.updateKids[sid] = new Subject<TreeEvent>()
//            }
            this.kids[sid] = statement;
//            this.order.push(sid);
            this.rev_order.unshift(sid);
          }
        );

        this.waiting = false;
      });
  }

  drop(event: CdkDragDrop<string[]>) {
    if(event.previousIndex != event.currentIndex && this.sid) {
      if(this.firstDrop) {
        this.dropEvent.emit(this.sid);
        this.firstDrop = false;
        this.oldOrder = Object.assign([], this.order);
      }
      moveItemInArray(this.order, event.previousIndex, event.currentIndex);
    }
  }

  getOrder() {
    if(!(this.sid in this.treeService.collection)) return;
    let agent = this.treeService.agent;
    if(this.aggregated && (this.sid in this.treeService.aggregateOrder))
      this.order = this.treeService.aggregateOrder[this.sid];
    else if (this.aggregated || !(agent in this.treeService.collection[this.sid].ranking_kids))
      this.order = this.treeService.collection[this.sid].kids.map(ref => ref.ref);
    else
      this.order = this.treeService.collection[this.sid].ranking_kids[agent];
    console.log('order', this.order);
  }
}
