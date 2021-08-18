import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ContractService } from '../contract.service';
import { TreeService } from '../tree.service';
import { Statement } from '../statement'
import { ActivatedRoute, Router } from '@angular/router';
import { TreeEvent } from './list/list.component';

@Component({
  selector: 'app-chatpage',
  templateUrl: './chatpage.component.html',
  styleUrls: ['./chatpage.component.css']
})
export class ChatpageComponent implements OnInit {

  updateTree: Subject<any> = new Subject<any>();

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private treeService: TreeService
  ) {}

  getUpdates(): void {
    this.treeService.getUpdates()
      .subscribe(updates => {
        for (let record of updates) {
          this.updateTree.next({'event': 'update', 'data': record} as TreeEvent);
        }
      });
  }


  ngOnInit(): void {
    let server = decodeURIComponent(this.route.snapshot.paramMap.get('server'));
    let agent = this.route.snapshot.paramMap.get('agent');
    let contract = this.route.snapshot.paramMap.get('contract');
    this.treeService.setScope(server, agent, contract);
    this.getUpdates();
    console.log('page is init');
    this.contractService.listen(server, agent, contract).addEventListener('message', message => {
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
