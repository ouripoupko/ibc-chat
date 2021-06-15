import { Component, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { Collection } from '../../statement';
import { Method } from '../../contract';
import { FormControl } from '@angular/forms';
import { ContractService } from '../../contract.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent implements OnInit, OnDestroy {

  @Input() sid: string;
  private eventsSubscription: Subscription;
  @Input() events: Observable<any>;
  kids: Collection = {};
  order: string[] = [];
  updateChild = {};
  statementForm: FormControl = new FormControl();
  waiting = true;
  isOpened = {};
  shouldUpdate = {};

  constructor( private contractService: ContractService ) {
  }

  ngOnInit(): void {
    console.log(`list is init ${this.sid}`)
    this.eventsSubscription = this.events.subscribe((record) => {
      if(record && record != false) {
        let shouldSkip = false;
        Object.entries(record['keys']).forEach(
          ([sid, paths]) => {
            if (!shouldSkip) {
              if(sid in this.kids) {
                if(this.isOpened[sid]) {
                  let tmp = {'keys': paths, 'record': record['record']};
                  console.log(tmp);
                  this.updateChild[sid].next(tmp)
                  this.shouldUpdate[sid] = false;
                } else {
                  if(Object.entries(paths).length > 0) {
                    this.shouldUpdate[sid] = true;
                  }
                }
              } else {
                this.getStatements();
              }
            }
          }
        );
      }
      else {
        this.getStatements();
      }
    });
  }

  ngOnDestroy() {
    this.eventsSubscription.unsubscribe();
  }

  changePanelState(index, isOpened): void {
    console.log(`panel changed ${isOpened}, ${this.sid}`)
    this.isOpened[index] = isOpened;
    if(isOpened) {
      this.updateChild[index].next(false);
      this.shouldUpdate[index] = false;
    }
  }

  submit() {
    this.createStatement(this.statementForm.value);
    this.statementForm.setValue("");
    this.waiting = true;
  }

  createStatement(statement): void {
    const method = { name: 'create_statement',
                     values: {'parents': this.sid ? [this.sid] : [], 'text': statement, 'tags': []}} as Method;
    this.contractService.createStatement(method)
      .subscribe();
  }

  getStatements(): void {
    this.waiting = true;
    this.contractService.getStatements({ name: 'get_statements', values: {'parent': this.sid}} as Method)
      .subscribe(collection => {
        this.order = [];
        Object.entries(collection).forEach(
          ([sid, statement]) => {
            if(!(sid in this.kids)) {
              this.updateChild[sid] = new Subject<any>();
              this.isOpened[sid] = false;
              this.shouldUpdate[sid] = (Object.keys(statement['kids']).length > 0);
            }
            this.kids[sid] = statement;
            this.order.push(sid);
          }
        );
        this.waiting = false;
      });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.order, event.previousIndex, event.currentIndex);
  }
}
