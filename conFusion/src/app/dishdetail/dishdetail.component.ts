import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Dish } from '../shared/dish';

import { DishService } from '../services/dish.service';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';

import { Comment } from '../shared/comment';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss']
})


export class DishdetailComponent implements OnInit {

  @ViewChild('cform') commentFormDirective;

  commentForm: FormGroup;
  comment: Comment;
  submitDisabled: boolean;
  dish: Dish;
  dishcopy: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  

  formErrors = {
    'rating': '',
    'comment': '',
    'author': ''
  };

  validationMessages = {
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 10 characters long.',
      'maxlength':     'Comment cannot be more than 500 characters long.'
    },
    'author': {
      'required':      'Author is required.',
      'minlength':     'Author must be at least 2 characters long.',
      'maxlength':     'Author cannot be more than 25 characters long.'
    },
  };


  constructor(private fb: FormBuilder,
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    @Inject('BaseURL') public BaseURL) {
      this.createForm();
    }

  ngOnInit() {
    this.dishService.getDishIds()
    .subscribe(dishIds => this.dishIds = dishIds,
      errmess => this.errMess = <any>errmess);
    this.route.params
      .pipe(switchMap((params: Params) => this.dishService.getDish(params['id'])))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); },
        errmess => this.errMess = <any>errmess );
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }
  
  createForm() {
    this.commentForm = this.fb.group({
      rating: 5,
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)] ],
      author: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(25)] ],
      date: new Date(),
    });
    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onSubmit() {
    this.comment = this.commentForm.value;

    console.log(this.comment)

    this.dish.comments.push(this.comment)
    
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      rating: 5,
      comment: '',
      author: '',
      date: new Date(),
    });

    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
      
  }
  
  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }

    let flag = (this.commentForm.getRawValue()['author'] !=  '' 
                && this.commentForm.getRawValue()['comment'] !=  '' 
                && this.commentForm.getRawValue()['author'] !=  null
                && this.commentForm.getRawValue()['comment'] !=  null );

    const form = this.commentForm;

    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              flag = false;
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }

    this.submitDisabled = !flag;

  }

}
