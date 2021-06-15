import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { ContractService } from '../contract.service';
import { Statement } from '../statement'
import { Method } from '../contract';

@Component({
  selector: 'app-chatpage',
  templateUrl: './chatpage.component.html',
  styleUrls: ['./chatpage.component.css']
})
export class ChatpageComponent implements OnInit {

  id: string;
  title: string;
  counter: number = 0;
  updateTree: Subject<any> = new Subject<any>();

  constructor(
    private contractService: ContractService,
  ) {}

  getUpdates(): void {
    this.contractService.getUpdates({ name: 'get_updates', values: {'counter': this.counter}} as Method)
      .subscribe(updates => {
        for (let record of updates) {
          if(record['record']['counter'] > this.counter) {
            this.counter = record['record']['counter'];
          }
          this.updateTree.next(record);
        }
      });
  }


  ngOnInit(): void {
    this.id = '';
    this.title = 'Topics';
    console.log('page is init');
    this.contractService.listen().addEventListener('message', message => {
      console.log(message);
      if(message.data=="True") {
        this.getUpdates();
      } else {
        console.log("False");
      }
    });
  }

  ngAfterViewInit(): void {
    this.updateTree.next();
  }
}
