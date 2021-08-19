import { Component, OnInit } from '@angular/core';
import { ContractService } from '../contract.service';
import { TreeService } from '../tree.service';
import { ActivatedRoute } from '@angular/router';
import { TreeEvent } from './list/list.component';

@Component({
  selector: 'app-chatpage',
  templateUrl: './chatpage.component.html',
  styleUrls: ['./chatpage.component.css']
})
export class ChatpageComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private contractService: ContractService,
    private treeService: TreeService
  ) {}

  ngOnInit(): void {
    let server = decodeURIComponent(this.route.snapshot.paramMap.get('server'));
    let agent = this.route.snapshot.paramMap.get('agent');
    let contract = this.route.snapshot.paramMap.get('contract');
    this.treeService.setScope(server, agent, contract);
    this.treeService.getUpdates();
    console.log('page is init');
    this.contractService.listen(server, agent, contract).addEventListener('message', message => {
      if(message.data=="True") {
        this.treeService.getUpdates();
      } else {
        console.log("False");
      }
    });
  }

}
