jest.mock('../models/Review', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn()
}));

jest.mock('../models/Expert', () => ({
  findOneAndUpdate: jest.fn()
}));

jest.mock('../models/Appointment', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const { submitReview } = require('./reviewController');

const createResponse = () => ({
  statusCode: 200,
  payload: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.payload = body;
    return this;
  }
});

describe('submitReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('blocks review submission before appointment is completed', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        expertId: 'expert-1',
        rating: 5,
        feedback: 'Great consultation and useful guidance'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    Appointment.findById.mockResolvedValue({
      _id: 'appointment-1',
      farmerId: { toString: () => 'farmer-1' },
      expertId: { toString: () => 'expert-1' },
      status: 'active'
    });

    await submitReview(req, res, next);

    expect(Review.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Review can only be submitted after appointment completion');
  });

  test('blocks review submission from non-farmer', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        expertId: 'expert-1',
        rating: 5,
        feedback: 'Great consultation and useful guidance'
      },
      user: {
        id: 'expert-1',
        role: 'expert'
      }
    };
    const res = createResponse();
    const next = jest.fn();

    await submitReview(req, res, next);

    expect(Review.create).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Only farmer can submit review');
  });

  test('allows farmer review after appointment completion', async () => {
    const req = {
      body: {
        appointmentId: 'appointment-1',
        expertId: 'expert-1',
        rating: 5,
        feedback: 'Great consultation and useful guidance',
        notes: 'Very helpful'
      },
      user: {
        id: 'farmer-1',
        role: 'farmer'
      }
    };
    const res = createResponse();
    const next = jest.fn();
    const createdReview = {
      _id: 'review-1',
      appointmentId: 'appointment-1',
      farmerId: 'farmer-1',
      expertId: 'expert-1',
      rating: 5,
      feedback: 'Great consultation and useful guidance'
    };

    Appointment.findById.mockResolvedValue({
      _id: 'appointment-1',
      farmerId: { toString: () => 'farmer-1' },
      expertId: { toString: () => 'expert-1' },
      status: 'completed'
    });
    Review.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    Review.create.mockResolvedValue(createdReview);
    Appointment.findByIdAndUpdate.mockResolvedValue(true);

    await submitReview(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(Review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        appointmentId: 'appointment-1',
        farmerId: 'farmer-1',
        expertId: 'expert-1',
        rating: 5
      })
    );
    expect(Appointment.findByIdAndUpdate).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.payload.data).toBe(createdReview);
  });
});
