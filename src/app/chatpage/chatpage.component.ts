import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ContractService } from '../contract.service';
import { Statement } from '../statement'
import { Method } from '../contract';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeEvent } from './list/list.component';

@Component({
  selector: 'app-chatpage',
  templateUrl: './chatpage.component.html',
  styleUrls: ['./chatpage.component.css']
})
export class ChatpageComponent implements OnInit {

  server: string;
  agent: string;
  contract: string;
  counter: number = 0;
  updateTree: Subject<any> = new Subject<any>();

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService
  ) {}

  getUpdates(): void {
    let method = { name: 'get_updates', values: {'counter': this.counter}} as Method;
    this.contractService.read(this.server, this.agent, this.contract, method)
      .subscribe(updates => {
        for (let record of updates) {
          if(record['record']['counter'] > this.counter) {
            this.counter = record['record']['counter'];
          }
          this.updateTree.next({'event': 'update', 'data': record} as TreeEvent);
        }
      });
  }


  ngOnInit(): void {
    this.server = decodeURIComponent(this.route.snapshot.paramMap.get('server'));
    this.agent = this.route.snapshot.paramMap.get('agent');
    this.contract = this.route.snapshot.paramMap.get('contract');
    console.log('page is init');
    this.contractService.listen(this.server, this.agent, this.contract).addEventListener('message', message => {
      if(message.data=="True") {
        this.getUpdates();
      } else {
        console.log("False");
      }
    });
  }

  ngAfterViewInit(): void {
    this.updateTree.next({'event': 'init', 'data': true} as TreeEvent);
  }
}
