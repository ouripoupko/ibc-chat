import { Component, OnInit, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { TreeEvent } from '../list/list.component';
import { Statement } from '../../statement';
import { TreeService } from '../../tree.service';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {

  @Input() sid: string;
  @Input() statement: Statement;
  isOpened = false;
  updateList = new Subject<TreeEvent>();
  shouldUpdate = false;
  dropInProgress = false;
  hasKids = false;
  kid_aggregated = true;

  constructor(
    private treeService: TreeService
  ) { }

  ngOnInit(): void {
    this.statement = this.treeService.collection[this.sid];
    console.log('item', this.sid, this.statement);
    this.hasKids = (Object.keys(this.statement['kids']).length > 0);
    this.shouldUpdate = this.hasKids;
  }

  changePanelState(isOpened): void {
    this.isOpened = isOpened;
    if(isOpened) {
      this.updateList.next({'event': 'panel_state', 'data': 'opened'} as TreeEvent);
      this.shouldUpdate = false;
    }
  }

  onOrderApprove() {
    this.dropInProgress = false;
    this.updateList.next({'event': 'drop_done', 'data': true} as TreeEvent);
  }

  onOrderCancel(sid) {
    this.dropInProgress = false;
    this.updateList.next({'event': 'drop_done', 'data': false} as TreeEvent);
  }

  toggleOrder(sid) {
    this.kid_aggregated = !this.kid_aggregated;
  }

  startDropping(sid) {
    this.dropInProgress = true;
  }
}
