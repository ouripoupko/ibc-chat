import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { TreeService } from '../../tree.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

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

  @Input() sid: string;
  private treeSubscription: Subscription;
  @Input() events: Observable<TreeEvent>;
  order: string[] = [];
  statementForm: FormControl = new FormControl();
  waiting = true;
  firstDrop = true;
  @Output() dropEvent = new EventEmitter<string>();
  @Input() aggregated;
  _array = Array;

  constructor(
    private treeService: TreeService
  ) {
  }

  ngOnInit(): void {
    this.getOrder();
    this.treeSubscription = this.treeService.notifiers[this.sid].subscribe(() => {
      this.getOrder();
    });
    if (this.events) {
      this.events.subscribe((record) => {
        if(record['event'] == 'drop_done') {
          console.log('drop done: ' + record['data']);
          if(record['data']) {
            this.treeService.setRanking(this.sid, this.order);
          }
          this.getOrder();
          this.firstDrop = true;
        }
      });
    }
  }

  ngOnDestroy() {
     this.treeSubscription.unsubscribe();
  }

  ngOnChanges(changes) {
    if('aggregated' in changes) {
      this.getOrder();
    }
  }

  submit() {
    this.waiting = true;
    this.treeService.createStatement(this.sid, this.statementForm.value);
    this.statementForm.setValue("");
  }

  drop(event: CdkDragDrop<string[]>) {
    if(event.previousIndex != event.currentIndex && this.sid) {
      if(this.firstDrop) {
        this.dropEvent.emit(this.sid);
        this.firstDrop = false;
      }
      moveItemInArray(this.order, event.previousIndex, event.currentIndex);
    }
  }

  getOrder() {
    if(!(this.sid in this.treeService.collection)) return;
    let agent = this.treeService.agent;
    if(this.aggregated && (this.sid in this.treeService.aggregateOrder)) {
      this.order = this.treeService.aggregateOrder[this.sid];
    }
    else if (this.aggregated || !(agent in this.treeService.collection[this.sid].ranking_kids)) {
      this.order = this.treeService.collection[this.sid].kids.map(ref => ref.ref);
    }
    else {
      let kids = this.treeService.collection[this.sid].kids.map(ref => ref.ref);
      this.order = this.treeService.collection[this.sid].ranking_kids[agent];
      let missing = kids.filter(item => this.order.indexOf(item) < 0);
      this.order.push(...missing);
    }
    this.waiting = false;
  }
}
