import { Component, OnInit } from '@angular/core';
import { Contract } from '../contract';
import { ContractService } from '../contract.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

  identities: string[];
  contracts: Contract[];
  server: string;
  agent: string;
  contract: string;

  constructor(
    private router: Router,
    private contractService: ContractService
  ) { }

  ngOnInit(): void {
  }

  onServerChange(event, stepper) {
    this.identities = null;
    this.contracts = null;
    this.server = event.option.value;
    this.contractService.getIdentities(this.server)
      .subscribe(identities => {this.identities = identities; stepper.next();});
  }

  onIdentityChange(event, stepper) {
    this.contracts = null;
    this.agent = event.option.value;
    this.contractService.getContracts(this.server, this.agent)
      .subscribe(contracts => {this.contracts = contracts; stepper.next();});
  }

  onContractChange(event) {
    this.contract = event.option.value;
    this.router.navigate([`${encodeURIComponent(this.server)}/${this.agent}/${this.contract}`]);
  }

}
